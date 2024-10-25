// Function to parse JSON data from clipboard and display the meal plan
async function parseClipboard() {
    try {
        // Read text from clipboard
        const text = await navigator.clipboard.readText();
        // Parse JSON data
        const data = JSON.parse(text);
        // Display the meal plan
        displayMealPlan(data);
    } catch (error) {
        // Show error message if parsing fails
        document.getElementById('output').innerHTML = `
            <div class="error">
                Error: Could not parse clipboard content. 
                Make sure you've copied valid JSON data.
                <br>
                Technical details: ${error.message}
            </div>
        `;
    }
}

// Function to create a progress bar based on actual vs target values
function createProgressBar(actual, target) {
    const percentage = Math.min((actual / target) * 100, 100).toFixed(1);
    const isOverTarget = actual > target;
    return `
        <div class="progress-bar">
            <div class="progress-fill ${isOverTarget ? 'over-target' : ''}" 
                 style="width: ${percentage}%"></div>
            <span class="progress-text">${percentage}%</span>
        </div>
    `;
}

// Function to display the meal plan summary and details with consistency in styling and layout
function displayMealPlan(data) {
    // Initialize HTML with daily summary
    let html = `
        <div class="summary-container">
            <h2>Daily Summary</h2>
            <div class="summary-grid">
                <div class="summary-card">
                    <h3>Calories</h3>
                    <p>Target: ${data.summary.totalCalories.target} kcal</p>
                    <p>Actual: ${data.summary.totalCalories.actual.toFixed(1)} kcal</p>
                </div>
                <div class="summary-card">
                    <h3>Macros</h3>
                    <p>Carbs: ${data.summary.totalMacros.carbs.toFixed(1)}g</p>
                    <p>Protein: ${data.summary.totalMacros.protein.toFixed(1)}g</p>
                    <p>Fat: ${data.summary.totalMacros.fat.toFixed(1)}g</p>
                </div>
            </div>
        </div>
    `;

    // Iterate through each meal to display detailed information
    data.meals.forEach(meal => {
        html += `
            <div class="meal-container">
                <div class="meal-header">
                    <h2 contenteditable>Meal ${meal.mealNumber}</h2>
                </div>
                
                <div class="macro-comparison">
                    <div>
                        <h3>Macros</h3>
                        <p>Carbs: ${meal.actual.carbs}g</p>
                        <div class="progress-bar-container">
                            <div class="progress-bar" 
                                 style="width: ${Math.min((meal.actual.carbs / meal.targets.carbs) * 100, 100)}%; background-color: #4CAF50;">
                                <span class="progress-text">${Math.min((meal.actual.carbs / meal.targets.carbs) * 100, 100).toFixed(1)}%</span>
                            </div>
                        </div>
                        <p>Protein: ${meal.actual.protein}g</p>
                        <div class="progress-bar-container">
                            <div class="progress-bar" 
                                 style="width: ${Math.min((meal.actual.protein / meal.targets.protein) * 100, 100)}%; background-color: #2196F3;">
                                <span class="progress-text">${Math.min((meal.actual.protein / meal.targets.protein) * 100, 100).toFixed(1)}%</span>
                            </div>
                        </div>
                        <p>Fat: ${meal.actual.fat}g</p>
                        <div class="progress-bar-container">
                            <div class="progress-bar" 
                                 style="width: ${Math.min((meal.actual.fat / meal.targets.fat) * 100, 100)}%; background-color: #FF9800;">
                                <span class="progress-text">${Math.min((meal.actual.fat / meal.targets.fat) * 100, 100).toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Food</th>
                            <th>Portion (g)</th>
                            <th>Calories</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        // Iterate through each food item in the meal
        meal.foods.forEach(food => {
            html += `
                <tr>
                    <td>${food.food}</td>
                    <td>${food.portion}</td>
                    <td>${food.macros.calories}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;
    });

    // Insert the generated HTML into the output div
    document.getElementById('output').innerHTML = html;
}
