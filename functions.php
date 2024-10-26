<?php
session_start();

// Airtable API credentials
$airtable_api_token = AIRTABLE_API_TOKEN;
$airtable_base = AIRTABLE_BASE;
$airtable_table = AIRTABLE_FOOD_ITEMS_TABLE;
$airtable_trainers = AIRTABLE_TRAINERS_TABLE;

// Function to authenticate trainer
function authenticateTrainer($username, $password) {
    global $airtable_api_token, $airtable_base, $airtable_trainers;
    
    $url = "https://api.airtable.com/v0/$airtable_base/$airtable_trainers";
    $curl = curl_init($url);
    
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $airtable_api_token",
    ]);
    
    $response = curl_exec($curl);
    curl_close($curl);
    
    $records = json_decode($response, true)['records'] ?? [];
    
    foreach ($records as $record) {
        if (isset($record['fields']['Username']) && 
            isset($record['fields']['Password']) && 
            $record['fields']['Username'] === $username && 
            $record['fields']['Password'] === $password) {
            
            $status = $record['fields']['Status'] ?? '';
            
            switch($status) {
                case 'Active':
                case 'Trial':
                    session_start();
                    $_SESSION['trainer_id'] = $record['id'];
                    $_SESSION['trainer_username'] = $username;
                    return true;      // Login
                case 'Trial Expired':
                    return 'expired'; // Trial expired error
                default:
                    return false;
            }
        }
    }
    
    return false;  // Invalid credentials error
}

// Function to check if user is logged in
function isLoggedIn() {
    session_start();
    return isset($_SESSION['trainer_id']);
}

// Function to fetch food items from Airtable
function fetchFoodItems($api_token, $base_id, $table_id) {
    $url = "https://api.airtable.com/v0/$base_id/$table_id";
    $curl = curl_init($url);
    
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $api_token",
    ]);
    
    $response = curl_exec($curl);
    curl_close($curl);
    
    $records = json_decode($response, true)['records'] ?? [];
    
    usort($records, function($a, $b) {
        return strcmp($a['fields']['Alimento'], $b['fields']['Alimento']);
    });
    
    foreach ($records as &$record) {
        $record['fields']['Carboidrati'] = isset($record['fields']['Carboidrati']) ? floatval($record['fields']['Carboidrati']) : 0;
        $record['fields']['Proteine'] = isset($record['fields']['Proteine']) ? floatval($record['fields']['Proteine']) : 0;
        $record['fields']['Grassi'] = isset($record['fields']['Grassi']) ? floatval($record['fields']['Grassi']) : 0;
    }
    
    return $records;
}

// Fetch food items
$foodItems = fetchFoodItems($airtable_api_token, $airtable_base, $airtable_table);

// Helper function to sanitize input
function sanitize_input($data) {
    return htmlspecialchars(stripslashes(trim($data)));
}

// Process form submission
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['numero_di_pasti']) && isset($_POST['total_kcals'])) {
    try {
        $numero_di_pasti = intval($_POST['numero_di_pasti']);
        $total_kcals = intval($_POST['total_kcals']);
        
        if ($numero_di_pasti <= 0 || $total_kcals <= 0) {
            throw new Exception("Invalid input values");
        }
        
        $mealPlan = [];
        $totalPercentage = 0;

        // Retrieve original portions from form data
        $originalPortions = json_decode($_POST['original_portions'], true);

        for ($i = 0; $i < $numero_di_pasti; $i++) {
            $percentage = floatval($_POST["percentage_$i"]);
            $totalPercentage += $percentage;
            
            // Sanitize each food item
            $selectedFoods = isset($_POST["food_items_$i"]) ? array_map('sanitize_input', $_POST["food_items_$i"]) : [];
            
            // Get meal-specific macro percentages
            $carbsPerc = floatval($_POST["meal_carbs_$i"]);
            $proteinPerc = floatval($_POST["meal_protein_$i"]);
            $fatPerc = floatval($_POST["meal_fat_$i"]);
            
            // Validate macro percentages
            $macroTotal = $carbsPerc + $proteinPerc + $fatPerc;
            if (abs($macroTotal - 100) > 0.1) { // Allow for small floating point differences
                throw new Exception("Macro percentages for meal " . ($i + 1) . " must sum to 100%");
            }
            
            // Calculate meal-specific targets
            $mealCalories = $total_kcals * ($percentage / 100);
            $targetCarbs = ($mealCalories * ($carbsPerc / 100)) / 4;
            $targetProtein = ($mealCalories * ($proteinPerc / 100)) / 4;
            $targetFat = ($mealCalories * ($fatPerc / 100)) / 9;
            
            if (empty($selectedFoods)) {
                continue;
            }

            $foodPortions = [];
            $mealTotalCarbs = 0;
            $mealTotalProtein = 0;
            $mealTotalFat = 0;
            $mealTotalCalories = 0;

            foreach ($selectedFoods as $foodItem) {
                $foodFound = false;
                foreach ($foodItems as $item) {
                    if ($item['fields']['Alimento'] === $foodItem) {
                        $foodFound = true;
                        $carbsPer100g = floatval($item['fields']['Carboidrati']);
                        $proteinPer100g = floatval($item['fields']['Proteine']);
                        $fatPer100g = floatval($item['fields']['Grassi']);

                        // Use portion from originalPortions if available, otherwise calculate
                        $grams = isset($originalPortions[$foodItem]) 
                            ? $originalPortions[$foodItem] 
                            : floor(min(array_filter([
                                'carbs' => $carbsPer100g > 0 ? ($targetCarbs * 100) / $carbsPer100g : 0,
                                'protein' => $proteinPer100g > 0 ? ($targetProtein * 100) / $proteinPer100g : 0,
                                'fat' => $fatPer100g > 0 ? ($targetFat * 100) / $fatPer100g : 0
                            ], function($g) { return $g > 0; })));

                        // Calculate actual macros provided
                        $providedCarbs = ($carbsPer100g * $grams) / 100;
                        $providedProtein = ($proteinPer100g * $grams) / 100;
                        $providedFat = ($fatPer100g * $grams) / 100;
                        $providedCalories = ($providedCarbs * 4) + ($providedProtein * 4) + ($providedFat * 9);

                        // Update meal totals
                        $mealTotalCarbs += $providedCarbs;
                        $mealTotalProtein += $providedProtein;
                        $mealTotalFat += $providedFat;
                        $mealTotalCalories += $providedCalories;

                        $foodPortions[] = [
                            'food' => $foodItem,
                            'portion' => $grams,
                            'macros' => [
                                'carbs' => round($providedCarbs, 1),
                                'protein' => round($providedProtein, 1),
                                'fat' => round($providedFat, 1),
                                'calories' => round($providedCalories, 1)
                            ],
                            'per100g' => [
                                'carbs' => round($carbsPer100g, 1),
                                'protein' => round($proteinPer100g, 1),
                                'fat' => round($fatPer100g, 1)
                            ]
                        ];
                        break;
                    }
                }
                if (!$foodFound) {
                    throw new Exception("Food item not found in database: $foodItem");
                }
            }

            $mealPlan[] = [
                'mealNumber' => $i + 1,
                'percentage' => $percentage,
                'calories' => [
                    'target' => round($mealCalories, 1),
                    'actual' => round($mealTotalCalories, 1)
                ],
                'targets' => [
                    'carbs' => round($targetCarbs, 1),
                    'protein' => round($targetProtein, 1),
                    'fat' => round($targetFat, 1)
                ],
                'actual' => [
                    'carbs' => round($mealTotalCarbs, 1),
                    'protein' => round($mealTotalProtein, 1),
                    'fat' => round($mealTotalFat, 1)
                ],
                'macroPercentages' => [
                    'carbs' => $carbsPerc,
                    'protein' => $proteinPerc,
                    'fat' => $fatPerc
                ],
                'foods' => $foodPortions
            ];
        }

        // Validate total percentage
        if (abs($totalPercentage - 100) > 0.1) { // Allow for small floating point differences
            throw new Exception("Total meal percentages must sum to 100% (current: $totalPercentage%)");
        }

        // Calculate plan totals
        $planTotalActual = [
            'calories' => 0,
            'carbs' => 0,
            'protein' => 0,
            'fat' => 0
        ];

        foreach ($mealPlan as $meal) {
            foreach ($meal['foods'] as $food) {
                $planTotalActual['calories'] += $food['macros']['calories'];
                $planTotalActual['carbs'] += $food['macros']['carbs'];
                $planTotalActual['protein'] += $food['macros']['protein'];
                $planTotalActual['fat'] += $food['macros']['fat'];
            }
        }

        // Add plan summary
        $fullPlan = [
            'summary' => [
                'totalCalories' => [
                    'target' => $total_kcals,
                    'actual' => round($planTotalActual['calories'], 1)
                ],
                'totalMacros' => [
                    'carbs' => round($planTotalActual['carbs'], 1),
                    'protein' => round($planTotalActual['protein'], 1),
                    'fat' => round($planTotalActual['fat'], 1)
                ],
                'numberOfMeals' => $numero_di_pasti
            ],
            'meals' => $mealPlan
        ];

        // Convert the meal plan to JSON
        $jsonMealPlan = json_encode($fullPlan, JSON_PRETTY_PRINT);
        
        // Add a script to copy the meal plan to clipboard and show success message
        echo "<script>
            const mealPlanJson = $jsonMealPlan;
            navigator.clipboard.writeText(JSON.stringify(mealPlanJson, null, 2))
                .then(() => {
                    alert('Meal plan has been copied!');
                })
                .catch(err => {
                    console.error('Failed to copy meal plan:', err);
                    alert('Failed to copy meal plan. Please check console for details.');
                });
        </script>";

    } catch (Exception $e) {
        // Handle any errors that occurred during processing
        echo "<script>
            alert('Error: " . addslashes($e->getMessage()) . "');
        </script>";
    }
}

// Helper function to determine primary macro
function determinePrimaryMacro($carbs, $protein, $fat) {
    $total = $carbs + $protein + $fat;
    $ratios = [
        'carbs' => $carbs / $total,
        'protein' => $protein / $total,
        'fat' => $fat / $total
    ];
    
    if ($ratios['carbs'] > 0.5 || ($ratios['carbs'] > $ratios['protein'] * 1.5 && $ratios['carbs'] > $ratios['fat'] * 1.5)) {
        return 'carbs';
    }
    if ($ratios['protein'] > 0.5 || ($ratios['protein'] > $ratios['carbs'] * 1.5 && $ratios['protein'] > $ratios['fat'] * 1.5)) {
        return 'protein';
    }
    if ($ratios['fat'] > 0.5 || ($ratios['fat'] > $ratios['carbs'] * 1.5 && $ratios['fat'] > $ratios['protein'] * 1.5)) {
        return 'fat';
    }
    
    // Return the macro with highest ratio if no clear primary
    return array_keys($ratios)[array_search(max($ratios), $ratios)];
}
?>