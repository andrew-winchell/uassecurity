require([
    "esri/identity/OAuthInfo",
    "esri/identity/IdentityManager"
], function (OAuthInfo, esriId) {

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

    window.onload = () => {
        esriId.checkSignInStatus(info.portalUrl + "/sharing")
            .then(() => {
                console.log("Sign in Successfull.");
            
                console.log("window onload secure");
                userAuth();
            })
            .catch(() => {
                console.log("Public User");
            
                console.log("window onload public");
                LoadSurvey123();
            });
    }
    
    document.getElementById("sign-in").addEventListener('click', userAuth);

    function userAuth() {
        esriId.getCredential(info.portalUrl + "/sharing")
            .then((credentials) => {
                token = credentials.token;
                console.log(token);
                LoadSurvey123Secure(token);
            })
            .catch(error => {
                console.error("Authentication failed: ", error);
            });
    }

    function LoadSurvey123() {
        console.log("LoadSurvey123");
        let url_string = window.location.href;
        let url = new URL(url_string);
        let webform = new Survey123WebForm({
            container: 'mywebform',
            itemId: '3071dfd0d0fa42a4988d47332637b2d7',
            portalUrl: 'https://faasysops.maps.arcgis.com',
            // itemId: '4e43a9579f584a8ea1faf424d2e445f2',
            // portalUrl: 'https://cobecconsulting.maps.arcgis.com',
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
            container: 'mywebform',
            itemId: '3071dfd0d0fa42a4988d47332637b2d7',
            portalUrl: 'https://faasysops.maps.arcgis.com',
            // itemId: '4e43a9579f584a8ea1faf424d2e445f2',
            // portalUrl: 'https://cobecconsulting.maps.arcgis.com',
            width: '1200',
            token: token,
            globalId: url.searchParams.get("globalid"),
            mode: url.searchParams.get("globalid") == null ? '' : 'edit',
            onFormSubmitted: (data) => {window.parent.scrollTo(0,0)}
        });
    }
});