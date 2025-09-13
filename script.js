class InventoryManager {
    constructor() {
        // Carrega os produtos do localStorage, ou começa com lista vazia
        this.products = JSON.parse(localStorage.getItem('inventory')) || [];
        // Controla o próximo código interno gerado para os produtos
        this.nextId = parseInt(localStorage.getItem('nextId')) || 1;
        this.init(); // Inicializa as configurações
    }

    init() {
        this.setupTabNavigation(); // Configura o sistema de abas
        this.setupForm(); // Configura o formulário de adicionar produtos
        this.renderInventory(); // Renderiza a tabela de produtos já cadastrados
    }

    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-button'); // Botões que mudam de aba
        const tabPanes = document.querySelectorAll('.tab-pane'); // Conteúdos das abas

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab'); // Aba que será aberta

                // Remove a classe "active" de todas as abas e botões
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));

                // Ativa apenas a aba clicada
                button.classList.add('active');
                document.getElementById(targetTab).classList.add('active');
            });
        });
    }

    setupForm() {
        const form = document.getElementById('add-item-form'); // Formulário de cadastro de produto
        form.addEventListener('submit', (e) => {
            e.preventDefault(); // Impede recarregar a página
            this.addProduct(); // Chama função para adicionar produto
        });
    }

    generateInternalCode() {
        // Gera código como PROD0001, PROD0002, ...
        const code = `PROD${String(this.nextId).padStart(4, '0')}`;
        this.nextId++; // Incrementa para o próximo produto
        localStorage.setItem('nextId', this.nextId); // Salva no localStorage
        return code;
    }

    calculateProfit(purchaseValue, saleValue) {
        return saleValue - purchaseValue; // Lucro = venda - compra
    }

    addProduct() {
        const form = document.getElementById('add-item-form'); // Referência ao formulário
        const formData = new FormData(form); // Pega os dados do formulário (não usado diretamente aqui)

        // Variáveis que armazenam os valores dos inputs
        const productName = document.getElementById('product-name').value;
        const category = document.getElementById('category').value;
        const quantity = parseInt(document.getElementById('quantity').value);
        const purchaseValue = parseFloat(document.getElementById('purchase-value').value);
        const saleValue = parseFloat(document.getElementById('sale-value').value);
        const validityDate = document.getElementById('validity-date').value;
        const description = document.getElementById('description').value;

        // Validação dos dados
        if (!productName || !category || quantity < 0 || purchaseValue < 0 || saleValue < 0) {
            alert('Por favor, preencha todos os campos obrigatórios corretamente.');
            return;
        }

        // Objeto do produto
        const product = {
            id: Date.now(), // ID único baseado no tempo
            internalCode: this.generateInternalCode(), // Código gerado automaticamente
            name: productName,
            category: category,
            quantity: quantity,
            purchaseValue: purchaseValue,
            saleValue: saleValue,
            profit: this.calculateProfit(purchaseValue, saleValue), // Lucro do produto
            validityDate: validityDate || null, // Data de validade (opcional)
            description: description,
            createdAt: new Date().toISOString() // Data de criação
        };

        this.products.push(product); // Adiciona o produto ao array
        this.saveToStorage(); // Salva no localStorage
        this.renderInventory(); // Atualiza a tabela

        form.reset(); // Limpa o formulário

        document.querySelector('[data-tab="inventory"]').click(); // Vai para aba do inventário
        alert('Produto adicionado com sucesso!');
    }

    removeProduct(productId) {
        if (confirm('Tem certeza que deseja remover este produto?')) {
            // Remove produto cujo id não corresponde ao clicado
            this.products = this.products.filter(product => product.id !== productId);
            this.saveToStorage(); // Atualiza localStorage
            this.renderInventory(); // Atualiza tabela
        }
    }

    updateQuantity(productId, newQuantity) {
        const product = this.products.find(p => p.id === productId); // Localiza produto pelo id
        if (product) {
            product.quantity = Math.max(0, newQuantity); // Garante que não seja negativo
            this.saveToStorage(); // Salva no localStorage
            this.renderInventory(); // Atualiza a tabela
        }
    }
    getStatistics() {
        // Calcula estatísticas do inventário
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

    renderInventory() {
        const tbody = document.getElementById('inventory-table-body'); // Corpo da tabela
        tbody.innerHTML = ''; // Limpa antes de renderizar

        if (this.products.length === 0) {
            // Caso não haja produtos
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
            const row = document.createElement('tr'); // Nova linha na tabela

            // Formata data de validade
            const validityFormatted = product.validityDate 
                ? new Date(product.validityDate).toLocaleDateString('pt-BR')
                : 'Não informado';

            // Faz o cálculo com base na quantidade
            const item = this.getStatistics();
            // Formata valores em reais
            const purchaseFormatted = `R$ ${item.totalInvestment.toFixed(2).replace('.', ',')}`;
            const saleFormatted = `R$ ${item.totalValue.toFixed(2).replace('.', ',')}`;
            const profitFormatted = `R$ ${item.totalProfit.toFixed(2).replace('.', ',')}`;
            const profitClass = product.profit >= 0 ? 'profit-positive' : 'profit-negative';

            // Preenche linha com dados e botões de ação
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
            
            tbody.appendChild(row); // Adiciona linha ao corpo da tabela
        });

        this.addProfitStyles(); // Adiciona estilos de lucro positivo/negativo
    }

    addProfitStyles() {
        if (!document.getElementById('profit-styles')) {
            const style = document.createElement('style');
            style.id = 'profit-styles';
            style.textContent = `
                .profit-positive { color: #28a745; font-weight: bold; }
                .profit-negative { color: #dc3545; font-weight: bold; }
            `;
            document.head.appendChild(style); // Injeta estilos no <head>
        }
    }

    saveToStorage() {
        // Salva lista de produtos no localStorage
        localStorage.setItem('inventory', JSON.stringify(this.products));
    }

    exportData() {
        // Exporta inventário em formato JSON
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
                const importedProducts = JSON.parse(e.target.result); // Lê JSON do arquivo
                this.products = importedProducts; // Substitui lista de produtos
                this.saveToStorage();
                this.renderInventory();
                alert('Dados importados com sucesso!');
            } catch (error) {
                alert('Erro ao importar dados. Verifique o formato do arquivo.');
            }
        };
        reader.readAsText(file); // Lê arquivo como texto
    }


}

// Variável global que guarda a instância do inventário
let inventory;
document.addEventListener('DOMContentLoaded', () => {
    inventory = new InventoryManager(); // Cria objeto ao carregar página
});

// Mostra estatísticas em formato de alerta
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
