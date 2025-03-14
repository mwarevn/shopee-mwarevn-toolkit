fetch(`https://6514b3f1dc3282a6a3cd7125.mockapi.io/auto-boost-shopee-data`)
    .then((res) => res.json())
    .then((res) => {
        const shopeeAutoBoostStores = res;

        shopeeAutoBoostStores.forEach((store) => {
            const spc_cds = store.spc_cds;
            const cookie = store.cookie;
            const products = store.products.split(",");

            products.forEach((productId) => {
                const payload = JSON.stringify({ id: Number(productId) });

                if (productId && productId !== "") {
                    console.log({ payload });
                    fetch(
                        `https://banhang.shopee.vn/api/v3/product/boost_product/?version=3.1.0&SPC_CDS=${spc_cds}&SPC_CDS_VER=2`,
                        {
                            headers: {
                                accept: "application/json, text/plain, */*",
                                "accept-language": "vi,en-US;q=0.9,en;q=0.8",
                                "cache-control": "no-cache",
                                "content-type": "application/json;charset=UTF-8",
                                pragma: "no-cache",
                                priority: "u=1, i",
                                "sc-fe-ver": "21.90141",
                                "sec-ch-ua": '"Not:A-Brand";v="24", "Chromium";v="134"',
                                "sec-ch-ua-mobile": "?0",
                                "sec-ch-ua-platform": '"macOS"',
                                "sec-fetch-dest": "empty",
                                "sec-fetch-mode": "cors",
                                "sec-fetch-site": "same-origin",
                                cookie: cookie,
                                Referer: "https://banhang.shopee.vn/portal/product/list/live/all",
                                "Referrer-Policy": "strict-origin-when-cross-origin",
                            },
                            body: payload,
                            method: "POST",
                        }
                    )
                        .then((res) => res.json())
                        .then(console.log);
                }
            });
        });
    });
