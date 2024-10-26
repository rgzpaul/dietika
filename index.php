<?php
require_once '/home/keluwhr/sites/lucabandiera.it/utility/config.php';
require_once 'functions.php';

session_start();

// Validate session ID before displaying content
if (isset($_SESSION['trainer_id'], $_SESSION['session_id'])) {
    $currentSessionId = fetchTrainerSession($_SESSION['trainer_id']); // Get session ID from Airtable

    // Check if the session ID matches the one in Airtable
    if ($currentSessionId !== $_SESSION['session_id']) {
        session_unset(); // Clear session data
        session_destroy(); // End the session
        header('Location: ' . $_SERVER['PHP_SELF']); // Redirect to login page
        exit;
    }
}

// Handle login
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['username'])) {
    $result = authenticateTrainer($_POST['username'], $_POST['password']);
    if ($result === true) {
        header('Location: ' . $_SERVER['PHP_SELF']);
        exit;
    } else if ($result === 'expired') {
        $error = "This account has expired";
    } else {
        $error = "Invalid credentials";
    }
}

// Check if user is logged in, if not show login form
if (!isLoggedIn()) {
?>
    <!DOCTYPE html>
    <html>

    <head>
        <meta charset="UTF-8">
        <title>Login</title>
        <link rel="stylesheet" href="styles.css">
        <script async defer data-website-id="c777761a-0284-4e43-a07b-6bd6c3a2a014" src="https://sts.prgz.it/umami.js"></script>
    </head>

    <body>
        <div class="container">
            <h1>Login</h1>
            <form method="post" id="loginForm">
                <input type="text" name="username" placeholder="Username" required>
                <input type="password" name="password" placeholder="Password" required>
                <button type="button" onclick="submitForm()" data-umami-event="Login button" data-umami-event-user="">Accedi</button>
                <?php if (isset($error)) echo "<p>$error</p>"; ?>
            </form>
        </div>
        <script>
            function submitForm() {
                const username = document.querySelector('input[name="username"]').value;
                const button = document.querySelector('button[data-umami-event="Login button"]');
                button.setAttribute('data-umami-event-user', username);
                document.getElementById('loginForm').submit();
            }
        </script>
    </body>

    </html>
<?php
    exit;
}

// Process and display the meal planner content
$cleanFoodItems = array_map(function ($item) {
    return [
        'fields' => [
            'Alimento' => $item['fields']['Alimento'],
            'Carboidrati' => floatval($item['fields']['Carboidrati']),
            'Proteine' => floatval($item['fields']['Proteine']),
            'Grassi' => floatval($item['fields']['Grassi'])
        ]
    ];
}, $foodItems);
?>

<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <title>Meal Planner</title>
    <link rel="stylesheet" href="styles.css">
    <script async defer data-website-id="c777761a-0284-4e43-a07b-6bd6c3a2a014" src="https://sts.prgz.it/umami.js"></script>
</head>

<body>
    <div class="container">
        <h1>Meal Planner</h1>
        <form method="post" id="mealPlannerForm">
            <div class="total-inputs">
                <label for="total_kcals">Totale calorie:</label>
                <input type="number" id="total_kcals" name="total_kcals" min="1" required>

                <label for="numero_di_pasti">Numero di pasti:</label>
                <input type="number" id="numero_di_pasti" name="numero_di_pasti" min="1" required>
            </div>

            <div class="button-group">
                <button type="button" onclick="generateInputs()">Start</button>
                <button type="button" onclick="safeRefresh()">Refresh</button>
            </div>

            <div id="inputs_container"></div>
            <button type="submit" id="submit_button" style="display: none;">Vai al riepilogo</button>
        </form>

        <script>
            window.foodItems = <?php echo json_encode($foodItems, JSON_NUMERIC_CHECK); ?>;
        </script>
        <script src="functions.js"></script>
    </div>
</body>

</html>