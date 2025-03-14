const API_URL = `https://6514b3f1dc3282a6a3cd7125.mockapi.io/auto-boost-shopee-data`;
const allProds = new Set();
const boostingProds = new Set();
let SELLER_COOKIE, SPC_CDS, SHOP_ID, bumped_products_list;
let table_products, rows_of_table;
let saved_shop_id;

async function shopeeAuthFetch(
    url,
    method = "GET",
    options = {
        "Content-Type": "application/json",
        cookie: SELLER_COOKIE,
    }
) {
    const a = await fetch(url, {
        method,
        headers: { ...options },
    });

    return await a.json();
}

async function get_bumped_products_list() {
    try {
        const response = await shopeeAuthFetch(
            `https://banhang.shopee.vn/api/v3/mpsku/list/get_bumped_product_list?SPC_CDS=${SPC_CDS}&SPC_CDS_VER=2`
        );
        return response.message === "success" ? response.data : null;
    } catch (error) {
        console.error("Error fetching bumped products:", error);
        return null;
    }
}

async function get_shop_id() {
    try {
        const response = await shopeeAuthFetch(
            `https://banhang.shopee.vn/api/framework/selleraccount/shop_info/?SPC_CDS=${SPC_CDS}&SPC_CDS_VER=2&_cache_api_sw_v1_=1`
        );

        return response.message === "succ" ? response.data.shop_id : null;
    } catch (error) {
        console.error("Error fetching shop ID:", error);
        return null;
    }
}

// Lấy dữ liệu shop từ API
async function GetBoostedProds(id) {
    try {
        const response = await fetch(`${API_URL}?shopId=${id}`);

        if (response.status === 404) {
            return null;
        }

        const dataJson = await response.json();

        if (!dataJson || dataJson.length === 0) return null;

        return dataJson[0];
    } catch (error) {
        console.error("Error fetching existing shop data:", error);
        return null;
    }
}

async function waitingForProductsTable() {
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            console.log("Waiting for table...");
            table_products = document.querySelector(".product-list-section.list > .product-list-container tbody");
            rows_of_table = table_products?.querySelectorAll("tr");

            if (table_products && rows_of_table.length > 0) {
                console.log("Table found:", { table_products });
                clearInterval(interval);
                resolve();
            }
        }, 1000);
    }).then(fillData);
}

async function fillData() {
    const limit = bumped_products_list.config.total_slots;

    const rows = table_products.querySelectorAll("tr");

    rows.forEach((row) => {
        const productLink = row.querySelector(".product-variation-item .product-main .product-name-text .product-name-wrap a");
        if (!productLink) return;

        const productIdMatch = productLink.href.match(/(\d+)$/);
        if (!productIdMatch) return;

        const productId = productIdMatch[1];

        const div = document.createElement("div");
        div.style.marginTop = "18px";
        div.innerHTML = `
            <label class="switch" style="margin-left: 10px; display: inline-block;">
                <input type="checkbox" />
                <span class="slider"></span>
            </label>&nbsp;&nbsp;Tự động đẩy sản phẩm này
        `;

        div.querySelector("input").checked = boostingProds.has(productId);
        div.querySelector("input").onclick = (e) => {
            if (e.target.checked) {
                if (boostingProds.size != limit) {
                    return alert("Đã đạt tới giới hạn slots đẩy!");
                }

                boostingProds.add(productId);
            } else {
                boostingProds.delete(productId);
            }
            upsertData(saved_shop_id, SHOP_ID);
        };

        let prel =
            productLink.parentElement.parentElement.parentElement.parentElement.parentElement.querySelector(
                ".item-id .text-overflow2"
            );

        if (prel) {
            prel.appendChild(div);
        }
    });
}

// Cập nhật hoặc thêm mới dữ liệu lên API
async function upsertData(id, shopId) {
    const options = {
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            shopId,
            products: Array.from(boostingProds),
            cookie: SELLER_COOKIE,
            spc_cds: SPC_CDS,
        }),
        method: id ? "PUT" : "POST",
    };

    const UPSERT_URL = `${API_URL}${id ? `/${id}` : ""}`;

    try {
        const response = await fetch(UPSERT_URL, options);
        const result = await response.json();
        saved_shop_id = result.id;
        console.log("Upsert result:", result);
    } catch (error) {
        console.error("Error updating data:", error);
    }
}

async function init() {
    // Lấy cookie của tài khoản người bán
    chrome.runtime.sendMessage({ action: "get-seller-cookie" }, async function (response) {
        SELLER_COOKIE = response.cookie;
        SPC_CDS = (SELLER_COOKIE.match(/SPC_CDS=([^;]*)/) || [null])[1];

        if (SPC_CDS) {
            SHOP_ID = await get_shop_id();

            if (!SHOP_ID) return;

            bumped_products_list = await get_bumped_products_list();

            if (!bumped_products_list) return;

            // const bumped_prods = new Set([...bumped_products_list.products.map((i) => i.id)]);

            const boostedProds = await GetBoostedProds(SHOP_ID);

            if (boostedProds) {
                saved_shop_id = boostedProds.id;

                boostedProds.products.forEach((i) => {
                    // bumped_prods.has(Number(i)) && boostingProds.add(i);
                    boostingProds.add(i);
                });
            }

            waitingForProductsTable();
        }
    });
}

let lastUrl = window.location.href;
document.addEventListener("click", () => {
    if (lastUrl !== window.location.href) {
        lastUrl = window.location.href;
        init();
    }
});
(async () => init())();
