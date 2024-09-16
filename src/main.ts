import './style.css'

// https://emfy-test.vercel.app/


const SUBDOMAIN = 'anastasiiasierghiienko0093'; //Поддомен нужного аккаунта
const SECRET ='tThuDUfWIzDvk5dTdJ3WQcn14y1T0iHo23ADlglrvreQCIyYLSKYNbeAhqVQx2vq'
const CLIENT_ID='ebdf5d10-57a3-46a3-8241-647f37b4a769'

const API_URL = `https://${SUBDOMAIN}.amocrm.ru/api/v4`; // Замените на реальный URL API
let TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjVlZDFiMWQxY2U1NDUxZTVhZjg1ZWQ2MzIyMTI1NGVmNGRhMDk4ZTI5NWMzNTY2MDhmZTZlN2IzNmE0OWExY2IwYmRjZGQ5MTZiYjhkYWMzIn0.eyJhdWQiOiJlYmRmNWQxMC01N2EzLTQ2YTMtODI0MS02NDdmMzdiNGE3NjkiLCJqdGkiOiI1ZWQxYjFkMWNlNTQ1MWU1YWY4NWVkNjMyMjEyNTRlZjRkYTA5OGUyOTVjMzU2NjA4ZmU2ZTdiMzZhNDlhMWNiMGJkY2RkOTE2YmI4ZGFjMyIsImlhdCI6MTcyNjQ1NDgxNSwibmJmIjoxNzI2NDU0ODE1LCJleHAiOjE3Mjc3NDA4MDAsInN1YiI6IjExNTIwNzY2IiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjMxOTUxNDQyLCJiYXNlX2RvbWFpbiI6ImFtb2NybS5ydSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiNTE1ZmMxNTktNDJiMi00YmI0LTg4NzktZDg2N2I5N2RkMTEyIiwiYXBpX2RvbWFpbiI6ImFwaS1iLmFtb2NybS5ydSJ9.ACww8f6wF_zCfPP8uB_8dDN6d3z6vqPxulZBRsTiTdVTBrjeuQPsr2rh413w03SqdGOLvUyPHGuJ3FbBYy_UPiGTF_onS3LfGLjoWxLsnx1c9KwXXpdMhLjYJOU9kIfaK8Pfy90vl5yEEhaQ1t7EtcvuzvmZDxpFn6j4y5xtFV8XHm1L2s8OejzAuFzszDIh1GuK4tOrat6Refc67JJ8OCO2eaFMJ1aB5MVeWMzgDAq3geW1bW3_un_I38ON9mNQnYunAtgfcSsb4WOwjEvOQUJvtGkYZKzuu2-rf18U_6dYtVk_ARrVCIeRVruEq9S9r1olQ7jHSikS8D938SSLHg'
const DEALS_PER_REQUEST = 3;
const DELAY_BETWEEN_REQUESTS = 1000; // 1 секунда

let deals = [];
let openDealId = null;


function formatDate(date) {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
}

function getStatusColor(taskDate) {
    if (!taskDate) return 'red';
    const today = new Date();
    const taskDay = new Date(taskDate);
    const diffTime = taskDay - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'red';
    if (diffDays === 0) return 'green';
    return 'yellow';
}

async function fetchDeals() {

    for (let i = 0; i < deals.length; i += DEALS_PER_REQUEST) {
        const chunk = deals.slice(i, i + DEALS_PER_REQUEST);
        const promises = chunk.map(deal =>
            fetch(`${API_URL}/leads`,{
                method:'get',
                headers:{
                    Authorization:`Bearer ${TOKEN}`,
                    'User-Agent': 'amoCRM-oAuth-client/1.0'
                }
                })
                .then(response => response.json())
        );
        const results = await Promise.all(promises);
        results.forEach((deal, index) => {
            deals[i + index] = { ...deals[i + index], ...deal };
        });
        renderDeals();
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));

    }
}

function renderDeals() {
    const tbody = document.getElementById('deals-body');
    tbody.innerHTML = deals.map(deal => `
                <tr class="deal-row" data-id="${deal.id}">
                    <td>${deal.id}</td>
                    <td>${deal.name}</td>
                    <td>${deal.budget}</td>
                </tr>
                <tr class="deal-details" id="details-${deal.id}">
                    <td colspan="3">
                        <div class="loading" style="display: none;">Загрузка...</div>
                        <div class="details" style="display: none;">
                            <p><strong>Дата:</strong> <span class="date"></span></p>
                            <p><strong>Статус задачи:</strong> <span class="status"></span></p>
                        </div>
                    </td>
                </tr>
            `).join('');

    tbody.addEventListener('click', handleDealClick);
}

async function handleDealClick(event) {
    const dealRow = event.target.closest('.deal-row');
    if (!dealRow) return;

    const dealId = dealRow.dataset.id;
    const detailsRow = document.getElementById(`details-${dealId}`);

    if (openDealId && openDealId !== dealId) {
        const openDetailsRow = document.getElementById(`details-${openDealId}`);
        openDetailsRow.style.display = 'none';
    }

    if (detailsRow.style.display === 'table-row') {
        detailsRow.style.display = 'none';
        openDealId = null;
    } else {
        detailsRow.style.display = 'table-row';
        openDealId = dealId;

        const loadingDiv = detailsRow.querySelector('.loading') as HTMLElement;
        const detailsDiv = detailsRow.querySelector('.details') as HTMLElement;

        loadingDiv.style.display = 'block';
        detailsDiv.style.display = 'none';

        try {
            // const response = await fetch(`${API_URL}/deals/${dealId}`,{
            //     method:'get',
            //         headers:{
            //             Authorization:`Bearer ${TOKEN}`,
            //             'User-Agent': 'amoCRM-oAuth-client/1.0'
            //     }
            // });
            // const dealData = await response.json();
            const dealData = await getDeals(dealId)

            const dateSpan = detailsDiv.querySelector('.date') as HTMLElement;
            const statusSpan = detailsDiv.querySelector('.status') as HTMLElement;

            dateSpan.textContent = formatDate(dealData.date);

            const statusColor = getStatusColor(dealData.task?.date);
            statusSpan.innerHTML = `
                        <svg class="status-circle" width="20" height="20">
                            <circle cx="10" cy="10" r="8" fill="${statusColor}" />
                        </svg>
                        ${dealData.task?.status || 'Нет задачи'}
                    `;

            loadingDiv.style.display = 'none';
            detailsDiv.style.display = 'block';
        } catch (error) {
            console.error('Ошибка при загрузке данных сделки:', error);
            loadingDiv.textContent = 'Ошибка загрузки';
        }
    }
}

async function getDeals(id){
    await new Promise(resolve => setTimeout(resolve, 1000))
   return deals.find(el=>el.id===id)

}

// Имитация начальных данных (в реальном приложении эти данные должны приходить с сервера)
deals = [
    { id: 1, name: 'Сделка 1', budget: 10000 },
    { id: 2, name: 'Сделка 2', budget: 15000 },
    { id: 3, name: 'Сделка 3', budget: 20000 },
    { id: 4, name: 'Сделка 4', budget: 25000 },
    { id: 5, name: 'Сделка 5', budget: 30000 },
    { id: 6, name: 'Сделка 6', budget: 35000 },
    { id: 7, name: 'Сделка 7', budget: 40000 },
    { id: 8, name: 'Сделка 8', budget: 45000 },
    { id: 9, name: 'Сделка 9', budget: 50000 },
    { id: 10, name: 'Сделка 10', budget: 55000 },
];

renderDeals();
fetchDeals();


// setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)
