function getShopeeSellerCookie(sendResponse) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];

        chrome.cookies.getAll({ url: currentTab.url }, (cookies) => {
            const cookie = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
            sendResponse({ cookie });
        });
    });

    return true;
}

export { getShopeeSellerCookie };
