require([
    "esri/identity/OAuthInfo",
    "esri/identity/IdentityManager"
], function (OAuthInfo, esriId) {

    // window.onload = () => {
    //     LoadSurvey123();
    // }
    
    document.getElementById("sign-in").addEventListener('click', userAuth);

    function userAuth() {
        const info = new OAuthInfo({
            appId: "0iQHRlu9bRvesIIV",
            portalUrl: "https://faasysops.maps.arcgis.com",
            authNamespace: "portal_oauth_inline",
            flowtype: "auto",
            popup: false
        });

        esriId.registerOAuthInfos([info]);

        esriId.getCredential(info.portalUrl + "/sharing")
            .then((credentials) => {
                let token = credentials.token;
                console.log(token)
                LoadSurvey123(token);
            });

        esriId.checkSignInStatus(info.portalUrl + "/sharing")
            .then(() => {
                console.log("Sign in Successfull.");
            })
            .catch(() => {
                console.log("Public User");
            });
    }

    function LoadSurvey123(token) {
        let url_string = window.location.href;
        let url = new URL(url_string);
        let webform = new Survey123WebForm({
            container: 'mywebform',
            itemId: '7b4bd8a23e784a068b6c05626c36dd6d',
            portalUrl: 'https://faasysops.maps.arcgis.com',
            width: '1200',
            token: token,
            globalId: url.searchParams.get("globalid"),
            mode: url.searchParams.get("globalid")==null?'':'edit',
            onFormSubmitted: (data) => {window.parent.scrollTo(0,0)}
        });
    }
});