class InventoryManager {
    constructor() {
        this.products = JSON.parse(localStorage.getItem('inventory')) || [];
        this.nextId = parseInt(localStorage.getItem('nextId')) || 1;
        this.init();
    }

    init() {
        this.setupTabNavigation();
        this.setupForm();
        this.renderInventory();
    }


    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabPanes = document.querySelectorAll('.tab-pane');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                

                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));
                

                button.classList.add('active');
                document.getElementById(targetTab).classList.add('active');
            });
        });
    }

 
    setupForm() {
        const form = document.getElementById('add-item-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addProduct();
        });
    }


    generateInternalCode() {
        const code = `PROD${String(this.nextId).padStart(4, '0')}`;
        this.nextId++;
        localStorage.setItem('nextId', this.nextId);
        return code;
    }


    calculateProfit(purchaseValue, saleValue) {
        return saleValue - purchaseValue;
    }


    addProduct() {
        const form = document.getElementById('add-item-form');
        const formData = new FormData(form);
        
        const productName = document.getElementById('product-name').value;
        const category = document.getElementById('category').value;
        const quantity = parseInt(document.getElementById('quantity').value);
        const purchaseValue = parseFloat(document.getElementById('purchase-value').value);
        const saleValue = parseFloat(document.getElementById('sale-value').value);
        const validityDate = document.getElementById('validity-date').value;
        const description = document.getElementById('description').value;


        if (!productName || !category || quantity < 0 || purchaseValue < 0 || saleValue < 0) {
            alert('Por favor, preencha todos os campos obrigatórios corretamente.');
            return;
        }

        const product = {
            id: Date.now(), 
            internalCode: this.generateInternalCode(),
            name: productName,
            category: category,
            quantity: quantity,
            purchaseValue: purchaseValue,
            saleValue: saleValue,
            profit: this.calculateProfit(purchaseValue, saleValue),
            validityDate: validityDate || null,
            description: description,
            createdAt: new Date().toISOString()
        };

        this.products.push(product);
        this.saveToStorage();
        this.renderInventory();
        

        form.reset();
        

        document.querySelector('[data-tab="inventory"]').click();
        
        alert('Produto adicionado com sucesso!');
    }


    removeProduct(productId) {
        if (confirm('Tem certeza que deseja remover este produto?')) {
            this.products = this.products.filter(product => product.id !== productId);
            this.saveToStorage();
            this.renderInventory();
        }
    }


    updateQuantity(productId, newQuantity) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            product.quantity = Math.max(0, newQuantity); // Não permite quantidade negativa
            this.saveToStorage();
            this.renderInventory();
        }
    }


    renderInventory() {
        const tbody = document.getElementById('inventory-table-body');
        tbody.innerHTML = '';

        if (this.products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 20px; color: #666;">
                        Nenhum produto cadastrado. Adicione um produto para começar.
                    </td>
                </tr>
            `;
            return;
        }

        this.products.forEach(product => {
            const row = document.createElement('tr');
            

            const validityFormatted = product.validityDate 
                ? new Date(product.validityDate).toLocaleDateString('pt-BR')
                : 'Não informado';


            const purchaseFormatted = `R$ ${product.purchaseValue.toFixed(2).replace('.', ',')}`;
            const saleFormatted = `R$ ${product.saleValue.toFixed(2).replace('.', ',')}`;
            const profitFormatted = `R$ ${product.profit.toFixed(2).replace('.', ',')}`;
            const profitClass = product.profit >= 0 ? 'profit-positive' : 'profit-negative';

            row.innerHTML = `
                <td>${product.internalCode}</td>
                <td title="${product.description}">${product.name}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <button onclick="inventory.updateQuantity(${product.id}, ${product.quantity - 1})" 
                                style="background: #dc3545; color: white; border: none; border-radius: 3px; width: 25px; height: 25px; cursor: pointer;">-</button>
                        <span style="min-width: 30px; text-align: center;">${product.quantity}</span>
                        <button onclick="inventory.updateQuantity(${product.id}, ${product.quantity + 1})" 
                                style="background: #28a745; color: white; border: none; border-radius: 3px; width: 25px; height: 25px; cursor: pointer;">+</button>
                    </div>
                </td>
                <td>${validityFormatted}</td>
                <td>${purchaseFormatted}</td>
                <td>${saleFormatted}</td>
                <td class="${profitClass}">${profitFormatted}</td>
                <td class="actions">
                    <button onclick="inventory.removeProduct(${product.id})">Remover</button>
                </td>
            `;
            
            tbody.appendChild(row);
        });

        this.addProfitStyles();
    }


    addProfitStyles() {
        if (!document.getElementById('profit-styles')) {
            const style = document.createElement('style');
            style.id = 'profit-styles';
            style.textContent = `
                .profit-positive { color: #28a745; font-weight: bold; }
                .profit-negative { color: #dc3545; font-weight: bold; }
            `;
            document.head.appendChild(style);
        }
    }


    saveToStorage() {
        localStorage.setItem('inventory', JSON.stringify(this.products));
    }


    exportData() {
        const dataStr = JSON.stringify(this.products, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'inventario.json';
        link.click();
    }


    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedProducts = JSON.parse(e.target.result);
                this.products = importedProducts;
                this.saveToStorage();
                this.renderInventory();
                alert('Dados importados com sucesso!');
            } catch (error) {
                alert('Erro ao importar dados. Verifique o formato do arquivo.');
            }
        };
        reader.readAsText(file);
    }


    getStatistics() {
        const totalProducts = this.products.length;
        const totalQuantity = this.products.reduce((sum, product) => sum + product.quantity, 0);
        const totalInvestment = this.products.reduce((sum, product) => sum + (product.purchaseValue * product.quantity), 0);
        const totalValue = this.products.reduce((sum, product) => sum + (product.saleValue * product.quantity), 0);
        const totalProfit = totalValue - totalInvestment;

        return {
            totalProducts,
            totalQuantity,
            totalInvestment,
            totalValue,
            totalProfit
        };
    }
}


let inventory;
document.addEventListener('DOMContentLoaded', () => {
    inventory = new InventoryManager();
});


function showStatistics() {
    const stats = inventory.getStatistics();
    alert(`
        Estatísticas do Inventário:
        - Total de produtos: ${stats.totalProducts}
        - Quantidade total: ${stats.totalQuantity}
        - Investimento total: R$ ${stats.totalInvestment.toFixed(2)}
        - Valor total: R$ ${stats.totalValue.toFixed(2)}
        - Lucro total: R$ ${stats.totalProfit.toFixed(2)}
    `);
}

