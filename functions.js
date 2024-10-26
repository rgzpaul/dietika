// Global Variables

var isSubmitting = false;
let mealValidity = [];

// Core Initialization & Event Handlers

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('mealPlannerForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
});

function handleFormSubmit(event) {
    event.preventDefault();
    isSubmitting = true;
    
    const numMeals = parseInt(document.getElementById('numero_di_pasti').value, 10);
    let invalidMeals = [];
    let totalPercentage = 0;

    for (let i = 0; i < numMeals; i++) {
        const carbsPerc = parseFloat(document.getElementById(`meal_carbs_${i}`).value) || 0;
        const proteinPerc = parseFloat(document.getElementById(`meal_protein_${i}`).value) || 0;
        const fatPerc = parseFloat(document.getElementById(`meal_fat_${i}`).value) || 0;
        const macroTotal = carbsPerc + proteinPerc + fatPerc;

        const mealPercentage = parseFloat(document.getElementById(`percentage_${i}`).value) || 0;
        totalPercentage += mealPercentage;

        if (Math.abs(macroTotal - 100) > 0.01) {
            invalidMeals.push(`Meal ${i + 1} (Macro Total: ${macroTotal.toFixed(2)}%)`);
        }
    }

    let errorMessage = '';

    if (invalidMeals.length > 0) {
        errorMessage = `Please ensure all meals have macro percentages summing to 100%.\nInvalid Meals:\n- ${invalidMeals.join('\n- ')}`;
    }

    if (Math.abs(totalPercentage - 100) > 0.01) {
        errorMessage += `${errorMessage ? '\n\n' : ''}Total meal distribution must equal 100% (current: ${totalPercentage.toFixed(2)}%)`;
    }

    if (errorMessage) {
        alert(errorMessage);
        isSubmitting = false;
        return;
    }

    // Submit form normally to get the JSON response
    fetch(this.action, {
        method: 'POST',
        body: new FormData(this)
    })
    .then(response => response.text())
    .then(text => {
        // Extract the JSON data from the script tag in the response
        const match = text.match(/const mealPlanJson = (\{.*?\});/s);
        if (match) {
            const mealPlanData = JSON.parse(match[1]);
            
            // Store the data in sessionStorage
            sessionStorage.setItem('mealPlanData', JSON.stringify(mealPlanData));
            
            // Open magic.php in a new tab
            window.open('magic.php', '_blank');
        } else {
            throw new Error('Could not extract meal plan data from response');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while processing the meal plan.');
    })
    .finally(() => {
        isSubmitting = false;
    });
}

function generateInputs() {
    const numMeals = document.getElementById('numero_di_pasti').value;
    const container = document.getElementById('inputs_container');
    container.innerHTML = '';
    mealValidity = Array(numMeals).fill(true);

    for (let i = 0; i < numMeals; i++) {
        const mealDiv = document.createElement('div');
        mealDiv.classList.add('meal-input');
        mealDiv.innerHTML = `
            <h3>Meal ${i + 1}</h3>
            <label for="percentage_${i}">Meal Percentage (%):</label>
            <input type="number" id="percentage_${i}" name="percentage_${i}" required 
                   min="0" max="100" data-meal-index="${i}">
        
            <div class="meal-macro-distribution">
                <h4>Meal Macro Distribution</h4>
                <div class="macro-input-group">
                    <label for="meal_carbs_${i}">Carbs (%):</label>
                    <input type="number" id="meal_carbs_${i}" name="meal_carbs_${i}" 
                           min="0" max="100" required value="40"
                           data-meal-index="${i}">
                </div>
                <div class="macro-input-group">
                    <label for="meal_protein_${i}">Protein (%):</label>
                    <input type="number" id="meal_protein_${i}" name="meal_protein_${i}" 
                           min="0" max="100" required value="30"
                           data-meal-index="${i}">
                </div>
                <div class="macro-input-group">
                    <label for="meal_fat_${i}">Fat (%):</label>
                    <input type="number" id="meal_fat_${i}" name="meal_fat_${i}" 
                           min="0" max="100" required value="30"
                           data-meal-index="${i}">
                </div>
            </div>
            
            <label for="food_search_${i}">Search Foods:</label>
            <div class="food-selector" id="food_selector_${i}">
                <div class="search-container">
                    <input type="text" id="food_search_${i}" 
                           class="food-search" placeholder="Search foods..."
                           data-meal-index="${i}">
                    <div class="search-results" id="search_results_${i}"></div>
                </div>
                <div class="selected-foods" id="selected_foods_${i}"></div>
                <div id="food_items_container_${i}"></div> <!-- Container for hidden inputs -->
            </div>
            <div id="macro_error_${i}" class="error" style="display: none;"></div>
            <div id="nutrient_info_${i}" class="nutrient-info" style="display: block;"></div>
        `;
        container.appendChild(mealDiv);

        // Initialize food selector
        initializeFoodSelector(i);

        // Attach event listeners
        const percentageInput = mealDiv.querySelector(`#percentage_${i}`);
        const carbsInput = mealDiv.querySelector(`#meal_carbs_${i}`);
        const proteinInput = mealDiv.querySelector(`#meal_protein_${i}`);
        const fatInput = mealDiv.querySelector(`#meal_fat_${i}`);

        const updateHandler = () => {
            const isValid = validateMealMacros(i);
            if (isValid) {
                updateNutrientDisplay(i);
            }
        };

        percentageInput.addEventListener('input', updateHandler);
        carbsInput.addEventListener('input', updateHandler);
        proteinInput.addEventListener('input', updateHandler);
        fatInput.addEventListener('input', updateHandler);
    }

    toggleSubmitButton();
}

function safeRefresh() {
    document.getElementById('mealPlannerForm').reset();
    document.getElementById('inputs_container').innerHTML = '';
    document.getElementById('submit_button').style.display = 'none';
    document.getElementById('submit_button').disabled = true;

    const existingSummary = document.querySelector('.summary');
    if (existingSummary) {
        existingSummary.remove();
    }

    const cleanURL = window.location.protocol + "//" +
        window.location.host +
        window.location.pathname;
    window.history.replaceState({}, document.title, cleanURL);

    document.getElementById('total_kcals').focus();
}
// UI Validation & Display Functions

function validateMealMacros(mealIndex) {
    if (isSubmitting) return;

    const totalKcals = parseFloat(document.getElementById('total_kcals').value) || 0;
    const numMeals = parseInt(document.getElementById('numero_di_pasti').value) || 0;
    
    // Validate basic inputs first
    if (totalKcals <= 0 || numMeals <= 0) {
        mealValidity[mealIndex] = false;
        toggleSubmitButton();
        return false;
    }

    // Get all meal percentages and calculate total
    let totalMealPercentage = 0;
    for (let i = 0; i < numMeals; i++) {
        const mealPerc = parseFloat(document.getElementById(`percentage_${i}`).value) || 0;
        totalMealPercentage += mealPerc;
    }

    const carbsPerc = parseFloat(document.getElementById(`meal_carbs_${mealIndex}`).value) || 0;
    const proteinPerc = parseFloat(document.getElementById(`meal_protein_${mealIndex}`).value) || 0;
    const fatPerc = parseFloat(document.getElementById(`meal_fat_${mealIndex}`).value) || 0;
    
    const macroTotal = carbsPerc + proteinPerc + fatPerc;
    const errorElement = document.getElementById(`macro_error_${mealIndex}`);
    const nutrientInfoElement = document.getElementById(`nutrient_info_${mealIndex}`);
    
    // Get selected foods
    const hiddenInputContainer = document.getElementById(`food_items_container_${mealIndex}`);
    const selectedFoods = hiddenInputContainer.querySelectorAll(`input[name="food_items_${mealIndex}[]"]`).length;

    let errorMessages = [];

    // Check macros sum to 100%
    if (Math.abs(macroTotal - 100) > 0.01) {
        errorMessages.push(`Macro percentages must sum to 100% (current: ${macroTotal.toFixed(2)}%)`);
    }

    // Check if foods are selected
    if (selectedFoods === 0) {
        errorMessages.push('At least one food item must be selected');
    }

    // Check meal percentage
    const mealPerc = parseFloat(document.getElementById(`percentage_${mealIndex}`).value) || 0;
    if (mealPerc <= 0) {
        errorMessages.push('Meal percentage must be greater than 0');
    }

    // Check if total meal percentages exceed 100%
    if (totalMealPercentage > 100.01) {
        errorMessages.push(`Total meal percentages exceed 100% (current: ${totalMealPercentage.toFixed(2)}%)`);
    }

    if (errorMessages.length > 0) {
        errorElement.style.display = 'block';
        errorElement.innerHTML = errorMessages.join('<br>');
        nutrientInfoElement.style.display = 'none';
        mealValidity[mealIndex] = false;
    } else {
        errorElement.style.display = 'none';
        errorElement.innerHTML = '';
        nutrientInfoElement.style.display = 'block';
        mealValidity[mealIndex] = true;
    }
    
    toggleSubmitButton();
    return mealValidity[mealIndex];
}

function toggleSubmitButton() {
    const submitButton = document.getElementById('submit_button');
    const allValid = mealValidity.length > 0 && mealValidity.every(valid => valid === true);
    submitButton.disabled = !allValid;
    submitButton.style.display = allValid ? 'block' : 'none';
}

function toggleSubmitButton() {
    const submitButton = document.getElementById('submit_button');
    const totalKcals = parseFloat(document.getElementById('total_kcals').value) || 0;
    const numMeals = parseInt(document.getElementById('numero_di_pasti').value) || 0;
    
    // Basic input validation
    if (totalKcals <= 0 || numMeals <= 0) {
        submitButton.disabled = true;
        submitButton.style.display = 'none';
        return;
    }

    // Check total meal percentages
    let totalMealPercentage = 0;
    for (let i = 0; i < numMeals; i++) {
        const mealPerc = parseFloat(document.getElementById(`percentage_${i}`).value) || 0;
        totalMealPercentage += mealPerc;
    }

    // Check if all meals have foods selected
    let allMealsHaveFoods = true;
    for (let i = 0; i < numMeals; i++) {
        const hiddenInputContainer = document.getElementById(`food_items_container_${i}`);
        const selectedFoods = hiddenInputContainer.querySelectorAll(`input[name="food_items_${i}[]"]`).length;
        if (selectedFoods === 0) {
            allMealsHaveFoods = false;
            break;
        }
    }

    const allValid = mealValidity.length === numMeals && // Correct number of meals
                     mealValidity.every(valid => valid === true) && // All meals are valid
                     Math.abs(totalMealPercentage - 100) <= 0.01 && // Meal percentages sum to 100%
                     allMealsHaveFoods; // All meals have foods selected

    submitButton.disabled = !allValid;
    submitButton.style.display = allValid ? 'block' : 'none';
}

function generateProgressBars({ carbs, protein, fat }) {
    return `
            <div class="remaining-macros">
                <h4>Progress Towards Meal Targets:</h4>
                
                <div class="macro-progress">
                    <div class="macro-label">
                        <span>Carbs:</span>
                        <span${carbs.current > carbs.target ? ' style="color:red;"' : ''}>${carbs.current.toFixed(1)}g / ${carbs.target.toFixed(1)}g</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" 
                             style="width: ${Math.min(100, carbs.progress)}%; background-color: #4CAF50;">
                            <span class="progress-text">${Math.min(100, carbs.progress).toFixed(1)}%</span>
                        </div>
                    </div>
                    <div class="remaining-text">
                        ${carbs.current < carbs.target ?
        `Still needed: ${(carbs.target - carbs.current).toFixed(1)}g` :
        carbs.current > carbs.target ?
            `Exceeds by: ${(carbs.current - carbs.target).toFixed(1)}g` :
            'Target reached'}
                    </div>
                </div>

                <div class="macro-progress">
                    <div class="macro-label">
                        <span>Protein:</span>
                        <span${protein.current > protein.target ? ' style="color:red;"' : ''}>${protein.current.toFixed(1)}g / ${protein.target.toFixed(1)}g</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" 
                             style="width: ${Math.min(100, protein.progress)}%; background-color: #2196F3;">
                            <span class="progress-text">${Math.min(100, protein.progress).toFixed(1)}%</span>
                        </div>
                    </div>
                    <div class="remaining-text">
                        ${protein.current < protein.target ?
        `Still needed: ${(protein.target - protein.current).toFixed(1)}g` :
        protein.current > protein.target ?
            `Exceeds by: ${(protein.current - protein.target).toFixed(1)}g` :
            'Target reached'}
                    </div>
                </div>

                <div class="macro-progress">
                    <div class="macro-label">
                        <span>Fat:</span>
                        <span${fat.current > fat.target ? ' style="color:red;"' : ''}>${fat.current.toFixed(1)}g / ${fat.target.toFixed(1)}g</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" 
                             style="width: ${Math.min(100, fat.progress)}%; background-color: #FF9800;">
                            <span class="progress-text">${Math.min(100, fat.progress).toFixed(1)}%</span>
                        </div>
                    </div>
                    <div class="remaining-text">
                        ${fat.current < fat.target ?
        `Still needed: ${(fat.target - fat.current).toFixed(1)}g` :
        fat.current > fat.target ?
            `Exceeds by: ${(fat.current - fat.target).toFixed(1)}g` :
            'Target reached'}
                    </div>
                </div>
            </div>
        `;
}

function updateNutrientDisplay(mealIndex) {
    const totalKcals = parseFloat(document.getElementById('total_kcals').value) || 0;
    const mealPercentage = parseFloat(document.getElementById(`percentage_${mealIndex}`).value) || 0;

    // Get meal-specific macro percentages
    const carbsPerc = parseFloat(document.getElementById(`meal_carbs_${mealIndex}`).value) || 0;
    const proteinPerc = parseFloat(document.getElementById(`meal_protein_${mealIndex}`).value) || 0;
    const fatPerc = parseFloat(document.getElementById(`meal_fat_${mealIndex}`).value) || 0;

    // Calculate meal calories
    const mealCalories = totalKcals * (mealPercentage / 100);

    // Calculate macro targets based on meal-specific percentages
    const targetCarbs = (mealCalories * (carbsPerc / 100)) / 4;
    const targetProtein = (mealCalories * (proteinPerc / 100)) / 4;
    const targetFat = (mealCalories * (fatPerc / 100)) / 9;

    // Get selected foods from hidden input and handle empty case
    const hiddenInputContainer = document.getElementById(`food_items_container_${mealIndex}`);
    const hiddenInputs = hiddenInputContainer.querySelectorAll('input[name="food_items_' + mealIndex + '[]"]');
    const selectedFoodNames = Array.from(hiddenInputs).map(input => input.value).filter(name => name);

    // Step 1: Analyze each food's macro profile
    const foodProfiles = selectedFoodNames.map(foodName => {
        // Find the food item in the foodItems array
        const foodItem = getFoodDataByName(foodName);
        
        if (!foodItem) {
            console.warn(`Food data not found for: ${foodName}`);
            return null;
        }

        const carbsPer100g = parseFloat(foodItem.fields.Carboidrati);
        const proteinsPer100g = parseFloat(foodItem.fields.Proteine);
        const fatsPer100g = parseFloat(foodItem.fields.Grassi);
        const totalMacros = carbsPer100g + proteinsPer100g + fatsPer100g;

        return {
            name: foodName,
            macroRatios: {
                carbs: carbsPer100g / totalMacros,
                protein: proteinsPer100g / totalMacros,
                fat: fatsPer100g / totalMacros
            },
            macrosper100g: {
                carbs: carbsPer100g,
                protein: proteinsPer100g,
                fat: fatsPer100g
            },
            primaryMacro: determinePrimaryMacro(carbsPer100g, proteinsPer100g, fatsPer100g)
        };
    }).filter(profile => profile !== null);

    // Step 2: Group foods by their primary macro
    const foodsByPrimaryMacro = {
        carbs: foodProfiles.filter(f => f.primaryMacro === 'carbs'),
        protein: foodProfiles.filter(f => f.primaryMacro === 'protein'),
        fat: foodProfiles.filter(f => f.primaryMacro === 'fat')
    };

    // Step 3: Calculate initial distribution
    const macroDistribution = calculateInitialDistribution({
        foods: foodsByPrimaryMacro,
        targets: { carbs: targetCarbs, protein: targetProtein, fat: targetFat }
    });

    // Step 4: Calculate optimal portions
    const portions = calculateOptimalPortions(foodProfiles, macroDistribution);

    // Generate the nutrient info display
    let nutrientInfoHtml = `
        <h4>Meal Targets:</h4>
        <div class="macro-targets">
            <div class="macro-target-row">
                <span>Calories: ${mealCalories.toFixed(1)} kcal</span>
            </div>
            <div class="macro-target-row">
                <span>Carbs: ${targetCarbs.toFixed(1)}g (${carbsPerc}%)</span>
            </div>
            <div class="macro-target-row">
                <span>Protein: ${targetProtein.toFixed(1)}g (${proteinPerc}%)</span>
            </div>
            <div class="macro-target-row">
                <span>Fat: ${targetFat.toFixed(1)}g (${fatPerc}%)</span>
            </div>
        </div>
    `;

    if (portions && portions.length > 0) {
        nutrientInfoHtml += `<h4>Recommended Portions:</h4>`;

        let totalMealCarbs = 0;
        let totalMealProtein = 0;
        let totalMealFat = 0;

        portions.forEach(portion => {
            totalMealCarbs += portion.macros.carbs;
            totalMealProtein += portion.macros.protein;
            totalMealFat += portion.macros.fat;

            const calories = (portion.macros.carbs * 4) +
                (portion.macros.protein * 4) +
                (portion.macros.fat * 9);

            nutrientInfoHtml += `
                <div class="food-summary">
                    <strong>${portion.name}</strong><br>
                    Portion: ${portion.grams}g (Primary: ${portion.primaryMacro})<br>
                    Provides:<br>
                    - Carbs: ${portion.macros.carbs.toFixed(1)}g<br>
                    - Protein: ${portion.macros.protein.toFixed(1)}g<br>
                    - Fat: ${portion.macros.fat.toFixed(1)}g<br>
                    - Calories: ${calories.toFixed(1)} kcal
                </div>
            `;
        });

        // Add progress bars
        const carbsProgress = (totalMealCarbs / targetCarbs) * 100;
        const proteinProgress = (totalMealProtein / targetProtein) * 100;
        const fatProgress = (totalMealFat / targetFat) * 100;

        nutrientInfoHtml += generateProgressBars({
            carbs: { current: totalMealCarbs, target: targetCarbs, progress: carbsProgress },
            protein: { current: totalMealProtein, target: targetProtein, progress: proteinProgress },
            fat: { current: totalMealFat, target: targetFat, progress: fatProgress }
        });
    } else {
        nutrientInfoHtml += "<p>No food selected.</p>";
    }

    document.getElementById(`nutrient_info_${mealIndex}`).innerHTML = nutrientInfoHtml;
}

// Food Selection System

function initializeFoodSelector(mealIndex) {
    if (!foodItems || !foodItems.length) {
        console.warn('No food items available for selector initialization');
        return;
    }

    const searchInput = document.getElementById(`food_search_${mealIndex}`);
    const searchResults = document.getElementById(`search_results_${mealIndex}`);
    const selectedFoodsContainer = document.getElementById(`selected_foods_${mealIndex}`);
    const hiddenInputContainer = document.getElementById(`food_items_container_${mealIndex}`);
    let selectedFoods = new Set();

    // Add CSS for the food selector
    const style = document.createElement('style');
    style.textContent = `
        .food-selector {
            margin-bottom: 1rem;
        }
        .search-container {
            position: relative;
            margin-bottom: 0.5rem;
        }
        .food-search {
            width: 100%;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
        }
        .search-results {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #ccc;
            border-radius: 4px;
            max-height: 200px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
        }
        .search-result-item {
            padding: 8px;
            cursor: pointer;
        }
        .search-result-item:hover {
            background: #f0f0f0;
        }
        .selected-foods {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-top: 0.5rem;
        }
        .selected-food-tag {
            background: #e0e0e0;
            padding: 4px 8px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .remove-food {
            cursor: pointer;
            color: #666;
            font-weight: bold;
        }
        .macro-info {
            font-size: 0.8em;
            color: #666;
            margin-left: 4px;
        }
    `;
    document.head.appendChild(style);

    // Search input handler with error handling
    searchInput.addEventListener('input', debounce((e) => {
        const searchTerm = e.target.value.toLowerCase();
        if (searchTerm.length < 2) {
            searchResults.style.display = 'none';
            return;
        }

        const allFoods = getFoodOptions();
        const filteredFoods = allFoods.filter(food => 
            food.toLowerCase().includes(searchTerm) && 
            !selectedFoods.has(food)
        );

        searchResults.innerHTML = filteredFoods
            .map(food => {
                const foodData = getFoodDataByName(food);
                if (!foodData) return '';
                
                return `
                    <div class="search-result-item">
                        <div>${food}</div>
                        <div class="macro-info">
                            Carbs: ${foodData.fields.Carboidrati}g, 
                            Protein: ${foodData.fields.Proteine}g, 
                            Fat: ${foodData.fields.Grassi}g
                        </div>
                    </div>`;
            })
            .filter(html => html !== '')
            .join('');
        
        searchResults.style.display = filteredFoods.length ? 'block' : 'none';
    }, 300));

    // Handle search result selection
    searchResults.addEventListener('click', (e) => {
        const resultItem = e.target.closest('.search-result-item');
        if (resultItem) {
            // Extract only the food name, excluding the macro info
            const foodNameDiv = resultItem.querySelector('div:first-child');
            if (foodNameDiv) {
                const foodName = foodNameDiv.textContent.trim();
                console.log('Selected food:', foodName); // For debugging
                addSelectedFood(foodName);
                searchInput.value = '';
                searchResults.style.display = 'none';
            }
        }
    });

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchResults.contains(e.target) && e.target !== searchInput) {
            searchResults.style.display = 'none';
        }
    });

    function addSelectedFood(food) {
        // Clean the food name by removing any commas
        const cleanFoodName = food.trim();
        
        if (selectedFoods.has(cleanFoodName)) return;
        
        const foodData = getFoodDataByName(cleanFoodName);
        if (!foodData) {
            console.warn(`Food data not found for: ${cleanFoodName}`);
            return;
        }
        
        selectedFoods.add(cleanFoodName);
        const foodTag = document.createElement('div');
        foodTag.classList.add('selected-food-tag');
        foodTag.innerHTML = `
            <div>${food}</div>
            <div class="macro-info">
                C:${foodData.fields.Carboidrati}g, 
                P:${foodData.fields.Proteine}g, 
                F:${foodData.fields.Grassi}g
            </div>
            <span class="remove-food" data-food="${food}">×</span>
        `;
        selectedFoodsContainer.appendChild(foodTag);
        updateHiddenInput();
        
        // Trigger validation and nutrient update
        const isValid = validateMealMacros(mealIndex);
        if (isValid) {
            updateNutrientDisplay(mealIndex);
        }
    }

    // Handle removing selected foods
    selectedFoodsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-food')) {
            const foodToRemove = e.target.dataset.food;
            selectedFoods.delete(foodToRemove);
            e.target.parentElement.remove();
            updateHiddenInput();
            
            // Trigger validation and nutrient update
            const isValid = validateMealMacros(mealIndex);
            if (isValid) {
                updateNutrientDisplay(mealIndex);
            }
        }
    });

    function updateHiddenInput() {
        // Clear existing hidden inputs
        hiddenInputContainer.innerHTML = '';
        
        selectedFoods.forEach(food => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = `food_items_${mealIndex}[]`;
            input.value = food;
            hiddenInputContainer.appendChild(input);
        });
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Data Access Functions

function getFoodOptions() {
    if (!foodItems || !foodItems.length) {
        console.warn('No food items available');
        return [];
    }
    return foodItems.map(item => item.fields.Alimento);
}

function getFoodDataByName(foodName) {
    if (!foodItems || !foodItems.length) {
        console.warn('No food items available');
        return null;
    }
    return foodItems.find(item => item.fields.Alimento === foodName);
}

// Nutritional Analysis Functions

function calculateCalories(carbs, protein, fat) {
    return (carbs * 4) + (protein * 4) + (fat * 9);
}

function analyzeFoodProfile(food) {
    const { carbs, protein, fat } = food.macrosper100g;
    const total = carbs + protein + fat;
    
    // Calculate basic ratios
    const baseRatios = {
        carbs: carbs / total,
        protein: protein / total,
        fat: fat / total
    };

    // Calculate caloric contribution
    const calories = calculateCalories(carbs, protein, fat);
    const caloricRatios = {
        carbs: (carbs * 4) / calories,
        protein: (protein * 4) / calories,
        fat: (fat * 9) / calories
    };

    // Calculate density scores (grams of macro per calorie)
    const density = {
        carbs: carbs / calories,
        protein: protein / calories,
        fat: fat / calories
    };

    // Combine metrics into a final score for each macro
    const scores = {
        carbs: (baseRatios.carbs * 0.4) + (caloricRatios.carbs * 0.4) + (density.carbs * 0.2),
        protein: (baseRatios.protein * 0.4) + (caloricRatios.protein * 0.4) + (density.protein * 0.2),
        fat: (baseRatios.fat * 0.4) + (caloricRatios.fat * 0.4) + (density.fat * 0.2)
    };

    // Determine primary and secondary macros
    const sortedScores = Object.entries(scores)
        .sort(([,a], [,b]) => b - a);

    return {
        name: food.name,
        macrosper100g: food.macrosper100g,
        primaryMacro: sortedScores[0][0],
        secondaryMacro: sortedScores[1][0],
        scores: scores,
        caloriesper100g: calories,
        density: density
    };
}

function determinePrimaryMacro(carbs, protein, fat) {
    const total = carbs + protein + fat;
    const ratios = {
        carbs: carbs / total,
        protein: protein / total,
        fat: fat / total
    };

    if (ratios.carbs > 0.5 || (ratios.carbs > ratios.protein * 1.5 && ratios.carbs > ratios.fat * 1.5)) {
        return 'carbs';
    }
    if (ratios.protein > 0.5 || (ratios.protein > ratios.carbs * 1.5 && ratios.protein > ratios.fat * 1.5)) {
        return 'protein';
    }
    if (ratios.fat > 0.5 || (ratios.fat > ratios.carbs * 1.5 && ratios.fat > ratios.protein * 1.5)) {
        return 'fat';
    }

    return Object.entries(ratios).reduce((a, b) => a[1] > b[1] ? a : b)[0];
}

// Distribution Calculation Functions

function calculateOptimalDistribution(foods, targets) {
    // Analyze all foods
    const foodProfiles = foods.map(analyzeFoodProfile);
    
    // Group foods by primary and secondary macros
    const groupedFoods = {
        carbs: foodProfiles.filter(f => f.primaryMacro === 'carbs'),
        protein: foodProfiles.filter(f => f.primaryMacro === 'protein'),
        fat: foodProfiles.filter(f => f.primaryMacro === 'fat'),
        secondary: {
            carbs: foodProfiles.filter(f => f.secondaryMacro === 'carbs'),
            protein: foodProfiles.filter(f => f.secondaryMacro === 'protein'),
            fat: foodProfiles.filter(f => f.secondaryMacro === 'fat')
        }
    };

    // Initial distribution based on primary macro foods
    const distribution = calculatePrimaryDistribution(groupedFoods, targets);
    
    // Adjust for gaps using secondary macro foods
    const adjustedDistribution = adjustDistributionWithSecondary(distribution, groupedFoods, targets);
    
    // Final optimization
    return optimizeDistribution(adjustedDistribution, foodProfiles, targets);
}

function calculatePrimaryDistribution(groupedFoods, targets) {
    const distribution = {};
    
    Object.entries(targets).forEach(([macro, target]) => {
        const primaryFoods = groupedFoods[macro];
        
        if (primaryFoods.length === 0) {
            return; // Will be handled in secondary distribution
        }

        // Weight distribution by macro density and score
        const totalScore = primaryFoods.reduce((sum, food) => 
            sum + (food.scores[macro] * food.density[macro]), 0);

        primaryFoods.forEach(food => {
            const weight = (food.scores[macro] * food.density[macro]) / totalScore;
            distribution[food.name] = {
                grams: (target * weight * 100) / food.macrosper100g[macro],
                contribution: {}
            };
        });
    });

    return distribution;
}

function adjustDistributionWithSecondary(distribution, groupedFoods, targets) {
    // Calculate current macro totals
    const currentTotals = calculateMacroTotals(distribution, groupedFoods.all);
    
    // Find gaps in macro targets
    const gaps = {
        carbs: targets.carbs - currentTotals.carbs,
        protein: targets.protein - currentTotals.protein,
        fat: targets.fat - currentTotals.fat
    };

    // Fill gaps using secondary macro foods
    Object.entries(gaps).forEach(([macro, gap]) => {
        if (gap <= 0) return;

        const secondaryFoods = groupedFoods.secondary[macro];
        if (secondaryFoods.length === 0) return;

        // Distribute remaining targets among secondary foods
        const totalSecondaryScore = secondaryFoods.reduce((sum, food) => 
            sum + food.scores[macro], 0);

        secondaryFoods.forEach(food => {
            const weight = food.scores[macro] / totalSecondaryScore;
            const additionalGrams = (gap * weight * 100) / food.macrosper100g[macro];
            
            if (!distribution[food.name]) {
                distribution[food.name] = { grams: 0, contribution: {} };
            }
            distribution[food.name].grams += additionalGrams;
        });
    });

    return distribution;
}

function optimizeDistribution(distribution, foodProfiles, targets) {
    const maxIterations = 10;
    let currentIteration = 0;
    let bestDistribution = distribution;
    let bestError = calculateError(distribution, foodProfiles, targets);

    while (currentIteration < maxIterations) {
        // Try small adjustments to portions
        const adjustedDistribution = tryAdjustments(bestDistribution, foodProfiles, targets);
        const newError = calculateError(adjustedDistribution, foodProfiles, targets);

        if (newError < bestError) {
            bestDistribution = adjustedDistribution;
            bestError = newError;
        }

        currentIteration++;
    }

    // Round final portions to practical amounts
    return roundPortions(bestDistribution);
}

// Distribution Helper Functions

function calculateError(distribution, foodProfiles, targets) {
    const totals = calculateMacroTotals(distribution, foodProfiles);
    
    return Math.sqrt(
        Math.pow(totals.carbs - targets.carbs, 2) +
        Math.pow(totals.protein - targets.protein, 2) +
        Math.pow(totals.fat - targets.fat, 2)
    );
}

function roundPortions(distribution) {
    // Round to nearest 5g or 10g depending on portion size
    return Object.fromEntries(
        Object.entries(distribution).map(([name, data]) => {
            const roundingUnit = data.grams >= 100 ? 10 : 5;
            const roundedGrams = Math.round(data.grams / roundingUnit) * roundingUnit;
            return [name, { ...data, grams: roundedGrams }];
        })
    );
}

// Legacy Distribution Functions

function calculateInitialDistribution({ foods, targets }) {
    const distribution = {
        carbs: {},
        protein: {},
        fat: {}
    };

    Object.entries(targets).forEach(([macro, target]) => {
        const specializedFoods = foods[macro];
        if (specializedFoods.length === 0) {
            const allFoods = [...foods.carbs, ...foods.protein, ...foods.fat];
            allFoods.forEach(food => {
                distribution[macro][food.name] = target / allFoods.length;
            });
        } else {
            const totalRatio = specializedFoods.reduce((sum, food) =>
                sum + food.macroRatios[macro], 0);

            specializedFoods.forEach(food => {
                distribution[macro][food.name] =
                    (target * food.macroRatios[macro]) / totalRatio;
            });
        }
    });

    return distribution;
}

function calculateOptimalPortions(foodProfiles, distribution) {
    return foodProfiles.map(food => {
        const requiredGrams = {
            carbs: distribution.carbs[food.name] ?
                (distribution.carbs[food.name] * 100) / food.macrosper100g.carbs : 0,
            protein: distribution.protein[food.name] ?
                (distribution.protein[food.name] * 100) / food.macrosper100g.protein : 0,
            fat: distribution.fat[food.name] ?
                (distribution.fat[food.name] * 100) / food.macrosper100g.fat : 0
        };

        const limitingGrams = Math.min(
            ...Object.values(requiredGrams)
                .filter(g => g > 0 && isFinite(g))
        );

        const grams = Math.floor(limitingGrams || 0);

        return {
            name: food.name,
            grams: grams,
            macros: {
                carbs: (food.macrosper100g.carbs * grams) / 100,
                protein: (food.macrosper100g.protein * grams) / 100,
                fat: (food.macrosper100g.fat * grams) / 100
            },
            primaryMacro: food.primaryMacro
        };
    });
}