require([
    "esri/identity/OAuthInfo",
    "esri/identity/IdentityManager",
    "esri/portal/Portal",
    "esri/portal/PortalQueryParams"
], function (OAuthInfo, esriId, Portal, PortalQueryParams) {

    // window.onload = () => {
    //     LoadSurvey123();
    // }
    
    document.getElementById("sign-in").addEventListener('click', checkSignIn);

    const info = new OAuthInfo({
        appId: "0iQHRlu9bRvesIIV",
        portalUrl: "https://faasysops.maps.arcgis.com",
        authNamespace: "portal_oauth_inline",
        flowtype: "auto",
        popup: false
    });

    esriId.registerOAuthInfos([info]);

    function checkSignIn() {
        esriId
            .checkSignInStatus(info.portalUrl + "/sharing")
            .then(() => {
                // If signed in, show the username in the UI
                console.log("signed in")
                const portal = new Portal({
                    authMode: "immediate"
                });
                
                if (info.portalUrl !== "https://www.arcgis.com") {
                    portal.url = info.portalUrl;
                }

                portal.load().then(() => {
                    console.log(portal.user.fullName);
                    console.log(portal.user.username);
                });
            })
            .catch(() => {
                console.log("not signed in");
                signIn();
            })
    }

    function signIn() {
        esriId
            .checkSignInStatus(info.portalUrl + "/sharing")
            .then(() => {
                esriId.destroyCredentials();
                window.location.reload();
                console.log("destroy")
            })
            .catch(() => {
                esriId
                    .getCredential(info.portalUrl + "/sharing", {
                        oAuthPopupConfirmation: true
                    })
                    .then(() => {
                        checkSignIn();
                        LoadSurvey123()
                    });
            });
    }

    function LoadSurvey123() {
        let url_string = window.location.href;
        let url = new URL(url_string);
        let webform = new Survey123WebForm({
            container: 'mywebform',
            itemId: '7b4bd8a23e784a068b6c05626c36dd6d',
            portalUrl: 'https://faasysops.maps.arcgis.com',
            width: '1200',
            // token: token,
            globalId: url.searchParams.get("globalid"),
            mode: url.searchParams.get("globalid")==null?'':'edit',
            onFormSubmitted: (data) => {window.parent.scrollTo(0,0)}
        });
    }
});