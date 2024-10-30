class Inventory {
    constructor(maxSlots = 30) {
        this.slots = [];
        this.maxSlots = maxSlots;
        this.dragState = {
            isDragging: false,
            draggedSlot: null
        };
        
        // Define possible items
        this.possibleItems = [
            {
                id: 'lucky_clover',
                name: 'Lucky Clover',
                cost: 100,
                icon: '🍀',
                description: 'Brings good luck',
                use: () => {
                    console.log('Used Lucky Clover!');
                }
            },
            {
                id: 'star',
                name: 'Star Power',
                cost: 100,
                icon: '⭐',
                description: 'Grants star power',
                use: () => {
                    console.log('Used Star Power!');
                }
            },
            {
                id: 'diamond',
                name: 'Diamond',
                cost: 100,
                icon: '💎',
                description: 'A precious gem',
                use: () => {
                    console.log('Used Diamond!');
                }
            },
            {
                id: 'potion',
                name: 'Magic Potion',
                cost: 100,
                icon: '🧪',
                description: 'A mysterious potion',
                use: () => {
                    console.log('Used Magic Potion!');
                }
            },
            {
                id: 'crystal_ball',
                name: 'Crystal Ball',
                cost: 100,
                icon: '🔮',
                description: 'Reveals secrets',
                use: () => {
                    console.log('Used Crystal Ball!');
                }
            }
        ];
        
        // Initialize immediately instead of waiting for DOMContentLoaded
        this.initialize();
        
        // Remove the event listener from constructor
        // We'll handle purchases through a callback instead
        this.onPurchaseAttempt = null;
    }

    // Add method to set purchase callback
    setPurchaseCallback(callback) {
        this.onPurchaseAttempt = callback;
    }

    initialize() {
        const inventoryGrid = document.getElementById('inventoryGrid');
        if (!inventoryGrid) {
            console.error('Could not find inventoryGrid element');
            return;
        }
        
        // Clear existing slots
        inventoryGrid.innerHTML = '';
        this.slots = [];  // Reset slots array
        
        // Create slots
        for (let i = 0; i < 30; i++) {
            this.slots.push({
                id: i,
                item: null,
                quantity: 0
            });
            
            const slot = document.createElement('div');
            slot.className = 'inventory-slot empty';
            slot.id = `inventory-slot-${i}`;
            slot.draggable = true;
            
            // Add event listeners
            slot.addEventListener('dragstart', (e) => this.handleDragStart(e, i));
            slot.addEventListener('dragend', (e) => this.handleDragEnd(e));
            slot.addEventListener('dragover', (e) => this.handleDragOver(e));
            slot.addEventListener('dragenter', (e) => this.handleDragEnter(e));
            slot.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            slot.addEventListener('drop', (e) => this.handleDrop(e, i));
            slot.addEventListener('click', () => this.handleClick(i));
            
            inventoryGrid.appendChild(slot);
        }
        
        // Setup shop button
        const buyButton = document.getElementById('buyTestItem');
        if (buyButton) {
            buyButton.addEventListener('click', () => this.buyItem());
        }
    }

    handleDragStart(e, slotId) {
        const slot = this.slots[slotId];
        if (!slot.item) return;

        e.target.classList.add('dragging');
        this.dragState.isDragging = true;
        this.dragState.draggedSlot = slotId;
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        this.dragState.isDragging = false;
        this.dragState.draggedSlot = null;
        
        document.querySelectorAll('.inventory-slot').forEach(slot => {
            slot.classList.remove('drag-over');
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleDragEnter(e) {
        e.preventDefault();
        if (e.target.classList.contains('inventory-slot')) {
            e.target.classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        if (e.target.classList.contains('inventory-slot')) {
            e.target.classList.remove('drag-over');
        }
    }

    handleDrop(e, targetSlotId) {
        e.preventDefault();
        e.target.classList.remove('drag-over');
        
        if (!this.dragState.isDragging || this.dragState.draggedSlot === targetSlotId) return;

        const sourceSlot = this.slots[this.dragState.draggedSlot];
        const targetSlot = this.slots[targetSlotId];

        // Swap items between slots
        const tempItem = targetSlot.item;
        const tempQuantity = targetSlot.quantity;
        
        targetSlot.item = sourceSlot.item;
        targetSlot.quantity = sourceSlot.quantity;
        
        sourceSlot.item = tempItem;
        sourceSlot.quantity = tempQuantity;

        // Update the UI for both slots
        this.updateSlot(this.dragState.draggedSlot);
        this.updateSlot(targetSlotId);
    }

    handleClick(slotId) {
        const slot = this.slots[slotId];
        if (slot.item) {
            console.log(`Using item in slot ${slotId}: ${slot.item.name}`);
            slot.item.use();
        }
    }

    addItem(item) {
        const emptySlot = this.slots.find(slot => !slot.item);
        if (emptySlot) {
            emptySlot.item = item;
            emptySlot.quantity = 1;
            this.updateSlot(emptySlot.id);
            return true;
        }
        return false;
    }

    updateSlot(slotId) {
        const slot = this.slots[slotId];
        const slotElement = document.getElementById(`inventory-slot-${slotId}`);
        
        if (slot.item) {
            slotElement.className = 'inventory-slot';
            slotElement.draggable = true;
            slotElement.innerHTML = `
                <span class="item-icon">${slot.item.icon}</span>
            `;
        } else {
            slotElement.className = 'inventory-slot empty';
            slotElement.draggable = false;
            slotElement.innerHTML = '';
        }
    }

    buyItem() {
        const randomIndex = Math.floor(Math.random() * this.possibleItems.length);
        const item = this.possibleItems[randomIndex];
        
        // Use callback instead of event
        if (this.onPurchaseAttempt) {
            const success = this.onPurchaseAttempt(item, item.cost);
            if (success) {
                this.addItem(item);
            }
        }
    }
}

export default Inventory;
