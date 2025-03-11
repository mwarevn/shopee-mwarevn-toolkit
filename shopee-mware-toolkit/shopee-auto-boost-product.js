const shopData = {};
const productsForBoost = new Set();

const injectApiScript = document.querySelector('script[type="text/javascript"][data-type="inject-api"]');
const shopId = injectApiScript.innerText.split('"shopid":')[1].split(",")[0];

chrome.runtime.sendMessage({ action: "get-shopee-seller-cookie" }, function (response) {
    const cookie = response.cookie;
    const spc_cds = cookie.match(/SPC_CDS=([^;]*)/)[1];

    shopData.cookie = cookie;
    shopData.spc_cds = spc_cds;
    shopData.shopId = shopId;
});

chrome.storage.sync.get(["shopee-auto-boost-product"], function (result) {
    let savedProducts = result["shopee-auto-boost-product"].split(",");
    savedProducts.forEach((productId) => productsForBoost.add(productId));
});

let table = document.querySelector(".product-list-section.list > .product-list-container tbody");

!table &&
    new Promise((resolve) => {
        let interval = setInterval(() => {
            table = document.querySelector(".product-list-section.list > .product-list-container tbody");
            if (table) {
                clearInterval(interval);
                resolve();
            }
        }, 1000);
    }).then(() => {
        main();
    });

function main() {
    let rows = table.querySelectorAll("tr");

    rows.forEach((row) => {
        let productLink = row.querySelector(".product-variation-item .product-main .product-name-text .product-name-wrap a");
        let productId = productLink.href.match(/(\d+)$/)[1];

        let div = document.createElement("div");
        div.style.marginTop = "18px";
        div.innerHTML = `
<label class="switch">
  <input type="checkbox" />
  <span class="slider"></span>
</label>
  Tự động đẩy sản phẩm này
`;

        div.querySelector("input").checked = productsForBoost.has(productId);

        div.querySelector("input").onclick = (e) => {
            const isChecked = e.target.checked;

            isChecked ? productsForBoost.add(productId) : productsForBoost.delete(productId);

            chrome.storage.sync.set({ ["shopee-auto-boost-product"]: Array.from(productsForBoost).join(",") }, () => {
                // console.log("Saved");
                // chrome.storage.sync.get(["shopee-auto-boost-product"], function (result) {
                //     let savedProducts = result["shopee-auto-boost-product"].split(",");
                // });

                let products = Array.from(productsForBoost).join(",");
                shopData.products = products;

                console.log(shopData);

                upsertData(shopData);
            });
        };

        let prel =
            productLink.parentElement.parentElement.parentElement.parentElement.parentElement.querySelector(
                ".item-id .text-overflow2"
            );

        prel.appendChild(div);
    });
}

async function upsertData(data) {
    const options = {
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    };

    let url = `https://6514b3f1dc3282a6a3cd7125.mockapi.io/auto-boost-shopee-data?shopId=${data.shopId}`;
    let exitstsID;
    fetch(url, {
        method: "GET",
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.length !== 0) {
                options.method = "PUT";
                exitstsID = res[0].id;
                url = `https://6514b3f1dc3282a6a3cd7125.mockapi.io/auto-boost-shopee-data` + `/${exitstsID}`;
            } else {
                options.method = "POST";
                url = `https://6514b3f1dc3282a6a3cd7125.mockapi.io/auto-boost-shopee-data`;
            }
        })
        .finally(() => {
            fetch(url, options).then((res) => {
                console.log(res);
            });
        });
}
