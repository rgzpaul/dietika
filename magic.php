<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Riepilogo</title>
    <link rel="stylesheet" href="styles.css">
    <script async defer data-website-id="c777761a-0284-4e43-a07b-6bd6c3a2a014" src="https://sts.prgz.it/umami.js"></script>
</head>
<body>
    <div class="container">
        <h1>Riepilogo</h1>
        <div id="buttonContainer" class="button-container">
            <!-- This will be shown/hidden by JavaScript -->
        </div>
        <div id="output">
            <!-- Default error state that will be replaced if data exists -->
            <div class="error-container">
                <div class="error-message">
                    <h2>⚠️ Errore</h2>
                    <p>Non è possibile accedere direttamente a questa pagina. Si prega di generare prima un piano alimentare dalla pagina principale.</p>
                    <button onclick="window.location.href='index.php'" style="margin: 0px">Vai al Meal Planner</button>
                </div>
            </div>
        </div>
        <script>
            // Immediately check if we have data
            document.addEventListener('DOMContentLoaded', function() {
                const storedData = sessionStorage.getItem('mealPlanData');
                if (storedData) {
                    // Show print button if we have data
                    document.getElementById('buttonContainer').innerHTML = `
                        <button onclick="window.print()" data-umami-event="Print button">Stampa</button>
                    `;
                }
            });
        </script>
        <script src="summary.js"></script>
        <script src="https://unpkg.com/lucide@latest"></script>
    </div>
</body>
</html>