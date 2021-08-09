// global variables
let coinsArray = [];
let coinDiv;
let ChartInterval;

// IIFE function 
(function () {
    $(function () {
        clearInterval(ChartInterval);
        $(".loader").show();

        let url = "https://api.coingecko.com/api/v3/coins"
        $.get(url).then(coins => {
            coinsArray = coins;
            showCoins(coinsArray);
            $(".loader").hide();

        }).catch((e) => {
            console.error(e)
            alert("failed to extract data from the API")
        })

    })
})();


// iterates through the coins array and prints them to the container with the moreinfo div
function showCoins(coins) {
    for (let i = 0; i < coins.length; i++) {
        addCoinToUi(coins[i]);
        showMoreInfo(coins[i].id);
    }
}

// create the coin html element
function addCoinToUi(coin) {
    coinDiv = $(`
            <div class="col-sm" id="${coin.symbol}">
                <div class="coinCard">
                    <img src="${coin.image.small}"><br>
                    <div id="symbolAndCheckBox">
                        <h1 id="coinSymbol"> ${coin.symbol} </h1>
                        <label class="switch">
                        <input type="checkbox" id="check${coin.symbol}" onchange="onToggleClick(this,'${coin.symbol}')"></input>
                        <span class="slider round"></span>
                        </label>
                    </div>

                    <h1 id="coinName">${coin.name}</h1>

                    <div class="moreInfoDiv">
                        <button class="moreInfo collapsed" id="moreInfo${coin.id}" data-toggle="collapse" data-target="#${coin.id}" ></button>
                        <div class="spinner-border" id="loader${coin.id}"></div>
                    </div>

                    <div class="infoDiv collapse show" id="open${coin.id}">
                        <div class="card collapse in" id="${coin.id}"></div>
                    </div>
                </div>
            </div>`);
        $("#mainContainer").append(coinDiv)
}

// adds the moreInfo button to the coin card
let coins = new Map();
function showMoreInfo(coinId) {
        $(`#moreInfo${coinId}`).on("click", function () {
            // if the coin is already in the cache
           if(coins.has(coinId)) {
               let cachedCoin = coins.get(coinId)
               getMoreInfoData(coinId, cachedCoin)
           }
        //    if the coin is not in the cache and needs to be pulled out with ajax request
            else {
                $(`#loader${coinId}`).show();
                $.get(`https://api.coingecko.com/api/v3/coins/${coinId}`).then(coin => {
                    $(`#loader${coinId}`).hide();
                    let newCoin = coin.market_data.current_price
                    getMoreInfoData(coinId, newCoin)
                    coins.set(coin.id, {ils: coin.market_data.current_price.ils, usd: coin.market_data.current_price.usd, eur: coin.market_data.current_price.eur})
                    setTimeout(() => coins.delete(coin.id), 120000)
                }).catch((e) => {
                    console.error(e)
                    alert("failed to extract data from the API")
                })
            }
        })
}

function getMoreInfoData(coinId, coin) {
      $(`#${coinId}.card`).html(`
        <div>
            <span><i class="fas fa-shekel-sign"></i> ${coin.ils}</span><br>
            <span><i class="fas fa-dollar-sign"></i> ${coin.usd}</span><br>
            <span><i class="fas fa-euro-sign"></i> ${coin.eur}</span>
        </div`);
}

// toggle function that add the selected coin to an array which later will apear in the live reports tab
let selectedCoins = [];
let selectedToggleIds = [];
let togglesCounter = 0;

function onToggleClick(currentToggle, coinSymbol) {
    $("#errorMsg").html("")
    let toggleId = currentToggle.id;
    let SymbolCoinIndex = selectedCoins.indexOf(coinSymbol);
    let indexToggleId = selectedToggleIds.indexOf(toggleId);
    // if the coin is already toggled
    if (SymbolCoinIndex != -1) {
        selectedCoins.splice(SymbolCoinIndex, 1);
        selectedToggleIds.splice(indexToggleId, 1);

    // if the toggled coins array is less than 5 and can contain more coins
    } else {
        if (selectedCoins.length < 5) {
            if(togglesCounter == 0) {
                $("#errorMsg").html("Go to Live Reports to receive live updates on the coins value")
            }
            togglesCounter++
            selectedCoins.push(coinSymbol);
            selectedToggleIds.push(toggleId);
            // in case the user selected the sixth coin a modal opens that allows you to replace coin with another one
        } else {

            $("#modalBody").empty();
            $(`#${toggleId}`).prop('checked', false);

            $("#modalBody").html('To add the "<b id="b">' + coinSymbol.toUpperCase() + '</b>" coin, you must unselect one of the following: <br>');
            $("#myModal").css("display", "block");

            $("#keepCurrent").on("click", () => {
                $("#myModal").css("display", "none");
            });

            let counterId = 1;

            for (let i = 0; i < selectedCoins.length; i++) {

                $("#modalBody").append(
                `<div id="modalDiv">
                    <div class="card" id="modalCard">
                        <div class="card-body" id="modalCardBody">
                            <h6 id="modalCoinName" class="card-title">${selectedCoins[i].toUpperCase()}</h6>
                            <label class="switch" id="modalSwitch">
                                <input type="checkbox" class="checkboxes" id="chosenToggle${counterId}"><span class="slider round" id="modalslider"></span>
                            </label>
                        </div>    
                    </div>
                </div>`);

                $(`#chosenToggle${counterId}`).prop('checked', true);
                $(`#chosenToggle${counterId}`).on("change", () => {
                    let indexCoinRemove = selectedCoins.indexOf(selectedCoins[i]);
                    let ToggleTofalse = selectedToggleIds[indexCoinRemove];
                    selectedCoins.splice(indexCoinRemove, 1);
                    selectedToggleIds.splice(indexCoinRemove, 1);
                    selectedCoins.push(coinSymbol);
                    selectedToggleIds.push(toggleId);
                    $("#myModal").css("display", "none");
                    $(`#${ToggleTofalse}`).prop('checked', false);
                    doubleCheckToggle()
                })
                counterId++;
            }
        }
    }
}

// a function that checks if the toggled coins are still toggled 
function doubleCheckToggle() {
    for (let i = 0; i < selectedToggleIds.length; i++) {
        $(`#${selectedToggleIds[i]}`).prop('checked', true);
    }
}

// avoid invalid input in the search tab
$('#search-input').on('keypress', function (e) {
    let key = String.fromCharCode(!e.charCode ? e.which : e.charCode);
    if (!/^[A-Z0-9]+$/i.test(key)) {
        e.preventDefault();
    }
})

// on click function to the search input, iterates through the coins array to check if the input matches a coin in the array
$("#search-btn").on("click", function () {
    clearInterval(ChartInterval);
    let value = $(this.previousElementSibling).val().toUpperCase();
    
    let coinToShow = coinsArray.filter(currentSearch => currentSearch.symbol.toUpperCase() == value)
    
    for(let i=0; i<coinToShow.length; i++) {
        showSearchedCoin(coinToShow[i]);
        doubleCheckToggle()
        $("#errorMsg").html("");
        showClickedBtn("#home", "#liveReports", "#about")
        return 
    }
    
    if (value == "") {
        $("#errorMsg").html("You cannot leave that field empty");
    }
    
    else {
        $("#errorMsg").html("Could not find a matching coin");
    }
    
    $("#search-input").val("");
});

// updates the container with the search matches
function showSearchedCoin(coin) {
    // $("#errorMsg").html("")
    $(`#mainContainer`).empty();
    
    coinDiv = addCoinToUi(coin)
    showMoreInfo(coin.id)
    $("#mainContainer").append(coinDiv)
}

// click on home button to update the container with the coins array
function onHomeClicked() {
    $("#errorMsg").html("")
    clearInterval(ChartInterval);
    showClickedBtn("#home", "#liveReports", "#about")
    $(`#mainContainer`).empty();
    let coinsToShow = showCoins(coinsArray);
    doubleCheckToggle()
    $("#mainContainer").append(coinsToShow)
    
}

// updates the container with information about my self and my project
function onAboutClicked() {
    clearInterval(ChartInterval);
    doubleCheckToggle()
    $("#errorMsg").html("")
    showClickedBtn("#about", "#liveReports", "#home")
    $("#mainContainer").empty();
    let aboutDiv = $(`
        <div class="about">
                <h1 id="aboutHeadline">
                    My Project
                </h1>
                <div id="aboutMyInfo">
                25 years old, engaged to Naama, playes volleyball,
                born in Reut
                </div>
                <div id="aboutMyProject">
                This project is a website that shows the current value of virtual coins.
                You can see the value of the coins in Dollars, Euros and shekels.
                The website offers the user a live report page which updates the virtual coins value every two seconds.
                
                </div>
                <div id="imgDiv">
                    <img id="myPicture" src="myPicture.jpeg" alt="">
                </div>
        </div>
    `)

    $("#mainContainer").append(aboutDiv)
}

// updates the container with canvas chart that shows live changes of the currency of the selected coins. updates with an interval every 2 seconds.
function onLiveReportsClicked() {
   
    clearInterval(ChartInterval);
    doubleCheckToggle()
    $("#errorMsg").html("")
    if(selectedCoins == 0) {
        $("#errorMsg").html("You need to select at least one coin")
        return
    }
    
    $(".loader").show();
    showClickedBtn("#liveReports", "#about", "#home")

    $(`#mainContainer`).empty();
    let firstCoinSelected = [];
    let secondCoinSelected = [];
    let thirdCoinSelected = [];
    let fourthCoinSelected = [];
    let fifthCoinSelected = [];
    let coinKeysArray = []

    ChartInterval = setInterval(() => {
            getDataFromApi()
    }, 2000);
 
// pulls the coins data from an api
    function getDataFromApi() {
        let url = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${selectedCoins[0]},${selectedCoins[1]},${selectedCoins[2]},${selectedCoins[3]},${selectedCoins[4]}&tsyms=USD`
        $.get(url).then(result => {
            $(`#mainContainer`).html(`<div id="chartContainer" style="height: 550px; width: 100%;"></div>`)
            let currentTime = new Date();
            let coinCounter = 1;
            for(let key in result) {
                if(coinCounter == 1) {
                    firstCoinSelected.push({x: currentTime, y: result[key].USD})
                    coinKeysArray.push(key)
                }
                if(coinCounter == 2) {
                    secondCoinSelected.push({x: currentTime, y: result[key].USD})
                    coinKeysArray.push(key)
                }
                if(coinCounter == 3) {
                    thirdCoinSelected.push({x: currentTime, y: result[key].USD})
                    coinKeysArray.push(key)
                }
                if(coinCounter == 4) {
                    fourthCoinSelected.push({x: currentTime, y: result[key].USD})
                    coinKeysArray.push(key)
                }
                if(coinCounter == 5) {
                    fifthCoinSelected.push({x: currentTime, y: result[key].USD})
                    coinKeysArray.push(key)
                }
                coinCounter++
            }
            createChart()
            $(".loader").hide();
    
        })
    }

    // creates the canvas chart 
    function createChart() {   
        let options = {
            animationEnabled: false,
            backgroundColor: "white",
            title:{
                text: "Crypto coins currencies"
            },
            axisX: {
                ValueFormatString: "HH:mm:ss",
                titleFontColor: "red",
                lineColor: "red",
                labelFontColor: "red",
                tickColor: "red"
                
            },
            axisY: {
                suffix: "$",
                titleFontColor: "#4F81BC",
                lineColor: "#4F81BC",
                labelFontColor: "#4F81BC",
                tickColor: "#4F81BC"

            },
            toolTip: {
                shared: true
            },
            data: [{
                type: "spline",
                name: coinKeysArray[0],
                showInLegend: true,
                xValueFormatString: "HH:mm:ss",
                dataPoints: firstCoinSelected
            },
            {
                type: "spline",
                name: coinKeysArray[1],
                showInLegend: true,
                xValueFormatString: "HH:mm:ss",
                dataPoints: secondCoinSelected
            },
            {
                type: "spline",
                name: coinKeysArray[2],
                showInLegend: true,
                xValueFormatString: "HH:mm:ss",
                dataPoints: thirdCoinSelected
            },
            {
                type: "spline",
                name: coinKeysArray[3],
                showInLegend: true,
                xValueFormatString: "HH:mm:ss",
                dataPoints: fourthCoinSelected
            },
            {
                type: "spline",
                name: coinKeysArray[4],
                showInLegend: true,
                xValueFormatString: "HH:mm:ss",
                dataPoints: fifthCoinSelected
            }]
        };
            $("#chartContainer").CanvasJSChart(options);
            $("#mainContainer").append(options)
        }

}

// updates the navbar buttons highlight
function showClickedBtn(buttonToHighLight, buttonToHide, buttonToHide2) {
  $(buttonToHighLight).css("background-color", "#1fa71f");
  $(buttonToHide).css("background-color", "black");
  $(buttonToHide).css("border", "none");
  $(buttonToHide2).css("background-color", "black");
  $(buttonToHide2).css("border", "none");
}

// a function that makes the navbar stay in place
document.addEventListener("DOMContentLoaded", function () {
  window.addEventListener("scroll", function () {
      document.getElementById("navbar_top").classList.add("fixed-top");
      navbar_height = document.querySelector(".navbar").offsetHeight;
      document.body.style.paddingTop = navbar_height + "px";
  });
});

// press enter to apply search
let input = document.getElementById("search-input");
input.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    document.getElementById("search-btn").click();
  }
});