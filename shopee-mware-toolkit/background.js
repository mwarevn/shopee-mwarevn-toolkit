"use strict";

import { getShopeeSellerCookie } from "./common.js";

// Listen for all messages from the contents script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log("Received a message from the contents script!");
    switch (request.action) {
        case "get-shopee-seller-cookie":
            return getShopeeSellerCookie(sendResponse);
        default:
            break;
    }
});
