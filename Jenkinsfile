pipeline {
    agent {
        label "linux"
    }
    options {
           buildDiscarder logRotator(artifactDaysToKeepStr: '', artifactNumToKeepStr: '5', daysToKeepStr: '', numToKeepStr: '5')
    }
    environment {
        app_name= "uassecurity"
        mailRecipients = "john.r.evans@faa.gov"
    }

    stages {
        stage("cleanup"){
            steps{
                always {
                    deleteDir()
                    cleanWs cleanWhenAborted: true, cleanWhenFailure: true, cleanWhenNotBuilt: false, cleanWhenUnstable: true, notFailBuild: true
                }
            }
        }

        stage('PullRequestNotify') {
            steps{
                script {
                    if(env.CHANGE_ID){
                        if((env.CHANGE_TARGET).startsWith('develop') || (env.CHANGE_TARGET).startsWith('master')) {
                            emailext (
                                body: '''<a href="${CHANGE_URL}">PR request url</a> <br>PR_ID: ${CHANGE_ID} <br>Target_Branch: ${CHANGE_TARGET} <br>PR_Title: ${CHANGE_TITLE} <br>Author: ${CHANGE_AUTHOR}''',
                                mimeType: 'text/html',
                                subject: "PR request ${CHANGE_ID} for repo ${GIT_URL}",
                                to: "${mailRecipients}",
                                replyTo: "${mailRecipients}",
                                recipientProviders: [[$class: 'CulpritsRecipientProvider']]
                            )
                        }
                    }
                }
            }
        }

        stage("Archive"){
            when {
                anyOf {
                    branch 'develop';
                    branch 'master'
                }
            }
            steps{
                script {
                    if ( (env.GIT_BRANCH).startsWith('develop') ) {
                        env.templateId = "6644"
                        env.pattern = ""
                    }
                    if ( (env.GIT_BRANCH).startsWith('master') ) {
                        env.templateId = "6646"
                        env.pattern = ""
                    }
                    echo "branch name is:${BRANCH_NAME} application is:${app_name} git commit is:${GIT_COMMIT}"
                }
            }
            post{
                always{
                    echo "========executed========"
                }
                success{
                    echo "======== executed successfully========"
                }
                failure{
                    echo "======== execution failed========"
                }
            }
        }

        stage("Sonarqube Scan"){
            tools {
                jdk 'rh.java-17-openjdk'
            }
            when {
                anyOf {
                    branch 'develop'
                }
            }
            steps{
                echo "========executing the scan========"
                runSonarQubeScan()
            }
            post{
                always{
                    echo "========always========"
                }
                success{
                    echo "========A executed successfully========"
                }
                failure{
                    echo "========A execution failed========"
                }
            }
        }

        stage("Build Project") {
            when {
                anyOf {
                    branch 'develop';
                    branch 'master'
                }
            }
            steps {
                checkout scm
                zip dir: '', glob: '', zipFile: "${app_name}${pattern}.zip", overwrite: true
            }
            post {
                always {
                    echo "====++++local acrhive and fingerprint++++===="
                }
                success {
                    echo "====++++success++++===="
                }
                failure {
                    echo "====++++A execution failed++++===="
                }
                changed {
                    echo 'Things were different before...'
                }
            }
        }
        
        stage("Send Artifacts to Artifactory"){
            when {
                anyOf {
                    branch 'develop';
                    branch 'master'
                }
            }
            steps {
                echo "========Sending up server info========="
                rtServer (
                    id: "Artifactory-1",
                    url: "https://artifactory.faa.gov/artifactory",
                    credentialsId: 'uassecurity-deployer'
                )
                echo "====++++Deloying Artifacts++++===="
                rtUpload (
                    serverId: "Artifactory-1",
                    spec: """{
                        "files": [
                            {
                                "pattern": "${app_name}(*).zip",
                                "target": "faa-uassecurity/gov/faa/${app_name}/${GIT_BRANCH}/"
                            }
                        ]
                    }"""
                )
            }
            post {
                always {
                    echo "========always========"
                }
                success {
                    echo "========Everything worked! clean up time========"
                }
                failure {
                    echo "========Artifactory upload execution failed========"
                }
                changed {
                    echo "====++++Things were different before++++===="
                }
            }
        }

        stage('Release-Approval') {
            when {
                anyOf {
                    branch 'master'
                }
            }
            steps {
                emailext (
                    body: '''<a href="${BUILD_URL}input">click to approve</a> ${SCRIPT, template="groovy-html.template"}''',
                    mimeType: 'text/html',
                    subject: "[Jenkins] Waiting for your Approval! Job: '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                    to: "${mailRecipients}",
                    replyTo: "${mailRecipients}",
                    recipientProviders: [[$class: 'CulpritsRecipientProvider']]
                )
                timeout(time: 300, unit: 'SECONDS') {
                    input message: 'Approve the deployment?', ok: 'Yes', submitter: "${mailRecipients}"
                }
            }
            post{
                always{
                    echo "========always========"
                }
                success{
                    echo "========A executed successfully========"
                }
                failure{
                    echo "========A execution failed========"
                }
            }
        }
        
        stage("Pass to Ansible Tower"){
            when {
                anyOf {
                    branch 'develop';
                    branch 'master'
                }
            }
            steps {
                ansibleTower async: false, credential: '',
                extraVars: '''
                app_name: "${app_name}"
                BRANCH_NAME: "${BRANCH_NAME}" ''',
                importTowerLogs: true,
                importWorkflowChildLogs: false,
                inventory: '',
                jobTags: '',
                jobTemplate: "$templateId",
                jobType: 'run',
                limit: '',
                removeColor: true,
                skipJobTags: '',
                templateType: 'job',
                throwExceptionWhenFail: true,
                towerServer: 'Ansible Tower',
                towerCredentialsId: 'jenkins_deploy',
                verbose: false
            }
            post {
                always {
                    deleteDir()
                    cleanWs cleanWhenAborted: true, cleanWhenFailure: true, cleanWhenNotBuilt: false, cleanWhenUnstable: true, notFailBuild: true
                }
                failure {
                    echo "========pipeline execution failed========"
                }
            }
        }
    }
}
