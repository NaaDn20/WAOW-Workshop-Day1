document.addEventListener('DOMContentLoaded', function() {
    loadReports();
});

async function loadReports() {
    try {
        const [transRes, custRes] = await Promise.all([
            fetch('/api/transactions'),
            fetch('/api/customers')
        ]);

        const transactions = await transRes.json();
        const customers = await custRes.json()

        const totalSales = transactions.reduce((sum, t) => sum + parseFloat(t.TotalAmount), 0);
        const avgTransaction = transactions.length ? (totalSales / transactions.length) : 0;

        document.getElementById('totalSales').textContent = '$' + totalSales.toFixed(2);
        document.getElementById('transactionCount').textContent = transactions.length;
        document.getElementById('avgTransaction').textContent = '$' + avgTransaction.toFixed(2);

        const spending = {};
        transactions.forEach(t => {
            if (!spending[t.CustomerID]) spending[t.CustomerID] = 0;
            spending[t.CustomerID] += parseFloat(t.TotalAmount);
        });

        let topCustId = null;
        let maxSpend = -1;

        for (const [id, amount] of Object.entries(spending)) {
            if (amount > maxSpend) {
                maxSpend = amount;
                topCustId = id;
            }
        }

        const topCustomer = customers.find(c => c.CustomerID == topCustId);
        
        if (topCustomer) {
            document.getElementById('topCustomer').innerHTML = `
                <div class="display-6 fw-bold text-primary">$${maxSpend.toFixed(2)}</div>
                <div class="mt-2 fs-5">[ID: ${topCustomer.CustomerID}] ${topCustomer.Gender}, ${topCustomer.Age}y</div>
            `;
        } else {
            document.getElementById('topCustomer').innerHTML = `<div class="text-muted">No Data</div>`;
        }

        const payments = {};
        transactions.forEach(t => {
            if(!payments[t.PaymentMethod]) payments[t.PaymentMethod] = { count: 0, total: 0 };
            payments[t.PaymentMethod].count++;
            payments[t.PaymentMethod].total += parseFloat(t.TotalAmount);
        });

        const chartContainer = document.getElementById('paymentChart');
        chartContainer.innerHTML = '';

        for (const [method, data] of Object.entries(payments)) {
            const percent = (data.total / totalSales) * 100;
            let color = method === 'cash' ? 'bg-success' : (method === 'credit' ? 'bg-primary' : 'bg-info');

            chartContainer.innerHTML += `
                <div class="mb-3">
                    <div class="d-flex justify-content-between mb-1">
                        <span class="text-uppercase fw-bold">${method}</span>
                        <span>$${data.total.toFixed(2)} <small class="text-muted">(${data.count} tx)</small></span>
                    </div>
                    <div class="progress" style="height: 10px;">
                        <div class="progress-bar ${color}" role="progressbar" style="width: ${percent}%"></div>
                    </div>
                </div>
            `;
        }

        const recentContainer = document.getElementById('recentTransactions');
        recentContainer.innerHTML = '<div class="list-group list-group-flush">';
        
        transactions.slice(0, 5).forEach(t => {
            let custInfo = "Unknown";
            if(t.Gender) custInfo = `${t.Gender}, ${t.Age}y`;
            else {
                const c = customers.find(cust => cust.CustomerID == t.CustomerID);
                if(c) custInfo = `${c.Gender}, ${c.Age}y`;
            }
            
            recentContainer.innerHTML += `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <div class="fw-bold">Transaction #${t.TransactionID}</div>
                        <small class="text-muted">${custInfo}</small>
                    </div>
                    <span class="fw-bold text-dark">$${parseFloat(t.TotalAmount).toFixed(2)}</span>
                </div>
            `;
        });
        recentContainer.innerHTML += '</div>';

    } catch (error) {
        console.error('Error loading reports:', error);
    }
}