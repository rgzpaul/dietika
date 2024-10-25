var isSubmitting = false;
let mealValidity = [];

function generateInputs() {
    const numMeals = document.getElementById('numero_di_pasti').value;
    const container = document.getElementById('inputs_container');
    container.innerHTML = '';
    mealValidity = Array(numMeals).fill(true); // Changed from false to true

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
            
            <label for="food_items_${i}">Foods:</label>
            <select id="food_items_${i}" name="food_items_${i}[]" multiple required 
                    data-meal-index="${i}">
                ${generateFoodOptions()}
            </select>
            <div id="macro_error_${i}" class="error"></div>
            <div id="nutrient_info_${i}" class="nutrient-info"></div>
        `;
        container.appendChild(mealDiv);

        // Attach Event Listeners
        const percentageInput = mealDiv.querySelector(`#percentage_${i}`);
        percentageInput.addEventListener('input', () => updateNutrientDisplay(i));

        const carbsInput = mealDiv.querySelector(`#meal_carbs_${i}`);
        carbsInput.addEventListener('input', () => validateMealMacros(i));

        const proteinInput = mealDiv.querySelector(`#meal_protein_${i}`);
        proteinInput.addEventListener('input', () => validateMealMacros(i));

        const fatInput = mealDiv.querySelector(`#meal_fat_${i}`);
        fatInput.addEventListener('input', () => validateMealMacros(i));

        const foodSelect = mealDiv.querySelector(`#food_items_${i}`);
        foodSelect.addEventListener('change', () => updateNutrientDisplay(i));
    }

    toggleSubmitButton();
}

function validateMealMacros(mealIndex) {
    if (isSubmitting) return;

    const carbsPerc = parseFloat(document.getElementById(`meal_carbs_${mealIndex}`).value) || 0;
    const proteinPerc = parseFloat(document.getElementById(`meal_protein_${mealIndex}`).value) || 0;
    const fatPerc = parseFloat(document.getElementById(`meal_fat_${mealIndex}`).value) || 0;
    
    const total = carbsPerc + proteinPerc + fatPerc;
    
    if (Math.abs(total - 100) > 0.01) {
        document.getElementById(`macro_error_${mealIndex}`).innerHTML = 
            `Macro percentages must sum to 100% (current: ${total.toFixed(2)}%)`;
        mealValidity[mealIndex] = false;
    } else {
        document.getElementById(`macro_error_${mealIndex}`).innerHTML = '';
        mealValidity[mealIndex] = true;
    }
    
    toggleSubmitButton();
    return mealValidity[mealIndex];
}

function toggleSubmitButton() {
    const submitButton = document.getElementById('submit_button');
    const allValid = mealValidity.length > 0 && mealValidity.every(valid => valid === true);
    submitButton.disabled = !allValid;

    if (allValid) {
        submitButton.style.display = 'block';
    } else {
        submitButton.style.display = 'none';
    }
}

function generateFoodOptions() {
    return foodItems.map(item =>
        `<option value="${item.fields.Alimento}" 
                     data-carbs="${item.fields.Carboidrati}" 
                     data-proteins="${item.fields.Proteine}" 
                     data-fats="${item.fields.Grassi}">
                ${item.fields.Alimento}
             </option>`
    ).join('');
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

    const select = document.getElementById(`food_items_${mealIndex}`);
    const selectedOptions = Array.from(select.selectedOptions);

    // Step 1: Analyze each food's macro profile
    const foodProfiles = selectedOptions.map(option => {
        const carbsPer100g = parseFloat(option.getAttribute('data-carbs'));
        const proteinsPer100g = parseFloat(option.getAttribute('data-proteins'));
        const fatsPer100g = parseFloat(option.getAttribute('data-fats'));
        const totalMacros = carbsPer100g + proteinsPer100g + fatsPer100g;

        return {
            name: option.value,
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
    });

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

document.getElementById('mealPlannerForm').addEventListener('submit', function (event) {
    isSubmitting = true;
    const numMeals = parseInt(document.getElementById('numero_di_pasti').value, 10);
    let invalidMeals = [];

    for (let i = 0; i < numMeals; i++) {
        const carbsPerc = parseFloat(document.getElementById(`meal_carbs_${i}`).value) || 0;
        const proteinPerc = parseFloat(document.getElementById(`meal_protein_${i}`).value) || 0;
        const fatPerc = parseFloat(document.getElementById(`meal_fat_${i}`).value) || 0;

        const total = carbsPerc + proteinPerc + fatPerc;

        if (Math.abs(total - 100) > 0.01) {
            invalidMeals.push(`Meal ${i + 1} (Total: ${total.toFixed(2)}%)`);
        }
    }

    if (invalidMeals.length > 0) {
        event.preventDefault(); // Prevent form submission
        alert(`Please ensure all meals have macro percentages summing to 100%.\nInvalid Meals:\n- ${invalidMeals.join('\n- ')}`);
    }

    isSubmitting = false;
});