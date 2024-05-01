require([
    "esri/identity/OAuthInfo",
    "esri/identity/IdentityManager"
], function (OAuthInfo, esriId) {

    let token = null;

    window.onload = () => {
        esriId.checkSignInStatus(info.portalUrl + "/sharing")
            .then(() => {
                console.log("Sign in Successfull.");
            
                console.log("window onload secure");
                LoadSurvey123Secure(token);
            })
            .catch(() => {
                console.log("Public User");
            
                console.log("window onload public");
                LoadSurvey123();
            });
    }
    
    document.getElementById("sign-in").addEventListener('click', userAuth);

    function userAuth() {
        const info = new OAuthInfo({
            // appId: "U8amYNIuc1osljKk",
            // portalUrl: "https://cobecconsulting.maps.arcgis.com",
            appId: "0iQHRlu9bRvesIIV", 
            portalUrl: "https://faasysops.maps.arcgis.com",
            authNamespace: "portal_oauth_inline",
            flowtype: "auto",
            popup: false
        });

        esriId.registerOAuthInfos([info]);

        esriId.getCredential(info.portalUrl + "/sharing")
            .then((credentials) => {
                token = credentials.token;
                console.log(token);
            });
    }

    function LoadSurvey123() {
        console.log("LoadSurvey123");
        let url_string = window.location.href;
        let url = new URL(url_string);
        let webform = new Survey123WebForm({
            clientId: "0iQHRlu9bRvesIIV",
            container: 'mywebform',
            itemId: '7b4bd8a23e784a068b6c05626c36dd6d',
            portalUrl: 'https://faasysops.maps.arcgis.com',
            width: '1200',
            globalId: url.searchParams.get("globalid"),
            mode: url.searchParams.get("globalid") == null ? '' : 'edit',
            onFormSubmitted: (data) => {window.parent.scrollTo(0,0)}
        });
    }

    function LoadSurvey123Secure(token) {
        console.log("LoadSurvey123Secure");
        document.getElementById('mywebform').innerHTML = '';

        let url_string = window.location.href;
        let url = new URL(url_string);
        let webform = new Survey123WebForm({
            clientId: "0iQHRlu9bRvesIIV",
            container: 'mywebform',
            itemId: '7b4bd8a23e784a068b6c05626c36dd6d',
            portalUrl: 'https://faasysops.maps.arcgis.com',
            width: '1200',
            token: token,
            globalId: url.searchParams.get("globalid"),
            mode: url.searchParams.get("globalid") == null ? '' : 'edit',
            onFormSubmitted: (data) => {window.parent.scrollTo(0,0)}
        });
    }
});