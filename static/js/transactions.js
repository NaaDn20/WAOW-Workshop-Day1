let customers = [];
let products = [];

document.addEventListener('DOMContentLoaded', function () {
    loadCustomers();
    loadProducts();
    loadTransactionsAndStats()
});

async function loadCustomers() {
    try {
        const response = await fetch('/api/customers');
        customers = await response.json();
        
        const select = document.getElementById('customer_id');
        select.innerHTML = '<option value="">-- Pilih Customer --</option>';
        
        customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.CustomerID;
            option.textContent = `[${customer.CustomerID}] ${customer.Gender}, ${customer.Age} thn`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading customers:', error);
        showNotification('Error loading customers', 'error');
    }
}

async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        products = await response.json();
        
        if (document.getElementById('itemsContainer').children.length === 0) {
            addItemRow();
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Error loading products', 'error');
    }
}

async function loadTransactionsAndStats() {
    try {
        const response = await fetch('/api/transactions');
        const transactions = await response.json();

        const tbody = document.querySelector('#transactionTable tbody');
        tbody.innerHTML = '';

        let totalSales = 0;

        transactions.forEach(transaction => {
            totalSales += parseFloat(transaction.TotalAmount);

            const row = document.createElement('tr');
            
            const dateObj = new Date(transaction.TransactionDate);
            const transactionDate = dateObj.toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short', 
                year: 'numeric',
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            });
            let customerInfo = "Unknown";
            if (transaction.Gender && transaction.Age) {
                customerInfo = `${transaction.Gender}, ${transaction.Age} thn`;
            } else {
                const c = customers.find(cust => cust.CustomerID === transaction.CustomerID);
                if (c) customerInfo = `${c.Gender}, ${c.Age} thn`;
            }

            row.innerHTML = `
                <td class="ps-3 fw-bold">#${transaction.TransactionID}</td>
                <td>
                    <div class="fw-bold">[ID: ${transaction.CustomerID}]</div>
                    <small class="text-muted">${customerInfo}</small>
                </td>
                <td>${transactionDate}</td>
                <td class="fw-bold text-primary">${formatCurrency(transaction.TotalAmount)}</td>
                <td>
                    <span class="badge bg-${getPaymentBadgeColor(transaction.PaymentMethod)}">
                        ${transaction.PaymentMethod}
                    </span>
                </td>
                <td class="text-end pe-3">
                    <button class="btn btn-sm btn-outline-info" onclick="viewTransactionDetails(${transaction.TransactionID})">
                        📄 Details
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        document.getElementById('totalSalesDisplay').textContent = formatCurrency(totalSales);
        document.getElementById('totalTransactionsDisplay').textContent = transactions.length;
        
        const avg = transactions.length > 0 ? (totalSales / transactions.length) : 0;
        document.getElementById('avgTransactionDisplay').textContent = formatCurrency(avg);

    } catch (error) {
        console.error('Error loading transactions:', error);
        showNotification('Error loading transactions', 'error');
    }
}

async function viewTransactionDetails(transactionId) {
    try {
        const response = await fetch(`/api/transactions/${transactionId}/details`);
        const items = await response.json();

        if (response.ok) {
            const tbody = document.getElementById('transactionDetailBody');
            tbody.innerHTML = '';

            items.forEach(item => {
                tbody.innerHTML += `
                    <tr>
                        <td class="ps-3 fw-bold">${item.ProductName}</td>
                        <td>${item.Quantity}</td>
                        <td>${formatCurrency(item.UnitPrice)}</td>
                        <td class="text-end pe-3 fw-bold">${formatCurrency(item.Subtotal)}</td>
                    </tr>
                `;
            });
            const modal = new bootstrap.Modal(document.getElementById('transactionDetailModal'));
            modal.show();
        } else {
            showNotification('Error loading transaction details', 'error');
        }
    } catch (error) {
        console.error('Error viewing transaction details:', error);
        showNotification('Error viewing transaction details', 'error');
    }
}


function addItemRow() {
    const container = document.getElementById('itemsContainer');
    const itemId = Date.now();

    const row = document.createElement('div');
    row.className = 'item-row row mb-2 g-2 align-items-center bg-white p-2 rounded border';
    row.id = `item-${itemId}`;

    let productOptions = '<option value="">Pilih Product</option>';
    products.forEach(product => {
        if (product.Stock > 0) {
            productOptions += `<option value="${product.ProductID}" data-price="${product.Price}">
                ${product.Name} (${formatCurrency(product.Price)})
            </option>`;
        }
    });

    row.innerHTML = `
        <div class="col-md-5">
            <select class="form-select product-select" onchange="updateItemPrice(${itemId})" required>
                ${productOptions}
            </select>
        </div>
        <div class="col-md-2">
            <input type="number" class="form-control quantity" placeholder="Qty" min="1" value="1" onchange="calculateItemSubtotal(${itemId})" required>
        </div>
        <div class="col-md-2">
            <input type="text" class="form-control unit-price bg-light" placeholder="Price" readonly>
        </div>
        <div class="col-md-2">
            <input type="text" class="form-control subtotal fw-bold bg-light" placeholder="Subtotal" readonly>
        </div>
        <div class="col-md-1 text-end">
            <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeItemRow(${itemId})">
                ×
            </button>
        </div>
    `;
    container.appendChild(row);
}

function updateItemPrice(itemId) {
    const row = document.getElementById(`item-${itemId}`);
    const select = row.querySelector('.product-select');
    const priceInput = row.querySelector('.unit-price');
    
    const selectedOption = select.selectedOptions[0];
    
    if (selectedOption && selectedOption.value) {
        const price = selectedOption.getAttribute('data-price');
        priceInput.value = parseFloat(price).toFixed(2); 
        calculateItemSubtotal(itemId);
    } else {
        priceInput.value = '';
        row.querySelector('.subtotal').value = '';
    }
}


function calculateItemSubtotal(itemId) {
    const row = document.getElementById(`item-${itemId}`);
    const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
    const price = parseFloat(row.querySelector('.unit-price').value) || 0;
    
    const subtotal = quantity * price;
    row.querySelector('.subtotal').value = subtotal.toFixed(2); 
    
    calculateTotal();
}

function removeItemRow(itemId) {
    const row = document.getElementById(`item-${itemId}`);
    if (row) {
        row.remove();
        calculateTotal();
    }
}

function calculateTotal() {
    const subtotalInputs = document.querySelectorAll('.subtotal');
    const quantityInputs = document.querySelectorAll('.quantity');
    
    let total = 0;
    let totalItems = 0;

    subtotalInputs.forEach(input => {
        total += parseFloat(input.value) || 0;
    });

    quantityInputs.forEach(input => {
        totalItems += parseInt(input.value) || 0;
    });

    document.getElementById('grandTotalDisplay').textContent = formatCurrency(total);
    document.getElementById('totalItems').textContent = totalItems;
}

document.getElementById('transactionForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const customerId = document.getElementById('customer_id').value;
    const paymentMethod = document.getElementById('payment_method').value;
    const itemRows = document.querySelectorAll('.item-row');
    
    let items = [];

    itemRows.forEach(row => {
        const productId = row.querySelector('.product-select').value;
        const quantity = row.querySelector('.quantity').value;
        const unitPrice = row.querySelector('.unit-price').value;
        const subtotal = row.querySelector('.subtotal').value;

        if (productId && quantity > 0) {
            items.push({
                product_id: parseInt(productId),
                quantity: parseInt(quantity),
                unit_price: parseFloat(unitPrice),
                subtotal: parseFloat(subtotal)
            });
        }
    });

    if (items.length === 0) {
        showNotification('Please add at least one valid item', 'error');
        return;
    }

    try {
        const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customer_id: parseInt(customerId),
                payment_method: paymentMethod,
                items: items
            })
        });

        const result = await response.json();

        if (response.ok) {
            showNotification('Transaction created successfully!', 'success');
            
            document.getElementById('transactionForm').reset();
            document.getElementById('itemsContainer').innerHTML = '';
            addItemRow();
            calculateTotal();
            
            loadTransactionsAndStats();
            loadProducts(); 
        } else {
            showNotification('Error: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error creating transaction:', error);
        showNotification('Error creating transaction', 'error');
    }
});

function getPaymentBadgeColor(paymentMethod) {
    switch(paymentMethod) {
        case 'cash': return 'success';
        case 'credit': return 'primary';
        case 'e-wallet': return 'info text-dark';
        default: return 'secondary';
    }
}