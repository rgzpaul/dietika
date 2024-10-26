// Inizialize
document.addEventListener('DOMContentLoaded', function() {
    // Try to get data from sessionStorage
    const storedData = sessionStorage.getItem('mealPlanData');
    if (storedData) {
        // Clear the data after retrieving it
        sessionStorage.removeItem('mealPlanData');
        // Display the meal plan
        displayMealPlan(JSON.parse(storedData));
    }
});

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
    const percentage = Math.min(Math.round((actual / target) * 100), 100);
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
            <div class="summary-grid">
                <div class="summary-card">
                    <h3>Calorie</h3>
                    <p>Target: ${Math.round(data.summary.totalCalories.target)} kcal</p>
                    <p>Attuali: ${Math.round(data.summary.totalCalories.actual)} kcal</p>
                </div>
                <div class="summary-card">
                    <h3>Macro</h3>
                    <p>Carboidrati: ${Math.round(data.summary.totalMacros.carbs)}g</p>
                    <p>Proteine: ${Math.round(data.summary.totalMacros.protein)}g</p>
                    <p>Grassi: ${Math.round(data.summary.totalMacros.fat)}g</p>
                </div>
            </div>
        </div>
    `;

    // Iterate through each meal to display detailed information
    data.meals.forEach(meal => {
        html += `
            <div class="meal-container">
                <div class="meal-header">
                <h2> <span contenteditable>Pasto n. ${meal.mealNumber}<span> <i data-lucide="pen-line" style="height: 30px"></i> </h2>
                </div>
                
                <div class="macro-comparison">
                    <div>
                        <h3>Macro</h3>
                        <p>Carboidrati: ${Math.round(meal.actual.carbs)}g</p>
                        <div class="progress-bar-container white">
                            <div class="progress-bar" 
                                 style="width: ${Math.round(Math.min((meal.actual.carbs / meal.targets.carbs) * 100, 100))}%; background-color: #4CAF50;">
                                <span class="progress-text">${Math.round(Math.min((meal.actual.carbs / meal.targets.carbs) * 100, 100))}%</span>
                            </div>
                        </div>
                        <p>Proteine: ${Math.round(meal.actual.protein)}g</p>
                        <div class="progress-bar-container white">
                            <div class="progress-bar" 
                                 style="width: ${Math.round(Math.min((meal.actual.protein / meal.targets.protein) * 100, 100))}%; background-color: #2196F3;">
                                <span class="progress-text">${Math.round(Math.min((meal.actual.protein / meal.targets.protein) * 100, 100))}%</span>
                            </div>
                        </div>
                        <p>Grassi: ${Math.round(meal.actual.fat)}g</p>
                        <div class="progress-bar-container white">
                            <div class="progress-bar" 
                                 style="width: ${Math.round(Math.min((meal.actual.fat / meal.targets.fat) * 100, 100))}%; background-color: #FF9800;">
                                <span class="progress-text">${Math.round(Math.min((meal.actual.fat / meal.targets.fat) * 100, 100))}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Alimento</th>
                            <th>Porzione (g)</th>
                            <th>Calorie</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        // Iterate through each food item in the meal
        meal.foods.forEach(food => {
            html += `
                <tr>
                    <td>${food.food}</td>
                    <td>${Math.round(food.portion)}</td>
                    <td>${Math.round(food.macros.calories)}</td>
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

    // Re-initialize Lucide icons
    lucide.createIcons();
}