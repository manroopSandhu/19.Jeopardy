const BASE_API_URL = "https://rithm-jeopardy.herokuapp.com/api/";
const NUM_CATEGORIES = 6;
const NUM_CLUES_PER_CAT = 5;

// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

// make an empty categories array
let categories = [];

/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */

async function getCategoryIds() {
  // ask for 100 categories [most we can ask for], so we can pick random
//   make a get request to the API and which gets 100 categories
  let response = await axios.get(`${BASE_API_URL}categories`, {
    params: { count: 100 }
  });
//   take the id property from each category object returned in the respose data 
  let catIds = response.data.map(c => c.id);
//                                                                                  (need clarifaction)  
                                                                                    return _.sampleSize(catIds, NUM_CATEGORIES);
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null, value: 200},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null, value: 400},
 *      ...
 *   ]
 */

async function getCategory(catId) {
    // Send a GET request to the API endpoint to fetch data related to a specific category
    // make a get request to the API which gets takes the params of the category Id
  let response = await axios.get(`${BASE_API_URL}category`, {
    params: { id: catId }
  });
  // Extract the data related to the category from the response
//   take the data from the response
  let cat = response.data;
  // Select a random subset of clues from the category and construct an array of clue objects
  let randomClues = _.sampleSize(cat.clues, NUM_CLUES_PER_CAT).map(c => ({
    question: c.question,
    answer: c.answer,
    showing: null
//   this line of code randomly selects a set of clues from the category, takes the question and answer for each question
  }));
// Return an object containing the title of the category and an array of randomly selected clues
  return { title: cat.title, clues: randomClues };
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */

async function fillTable() {
    // hide the view
  hideLoadingView();

  // Add row with headers for categories
  let $tr = $("<tr>");
//   iterate over each catergory
  for (let category of categories) {
    // create a new table hader cell ("th") with the text content set to the title of the category and append it to the table
    $tr.append($("<th>").text(category.title));
  }
//   append the table row containing the catergory headers to the table header with the ID "Jeopardy"
  $("#jeopardy thead").append($tr);

  // Add rows with questions for each category
  $("#jeopardy tbody").empty();
//   loop over the clueIdx from 0 up to the NUM_CLUES_PER_CAT then increment by 1
  for (let clueIdx = 0; clueIdx < NUM_CLUES_PER_CAT; clueIdx++) {
    // create a table row
    let $tr = $("<tr>");
    // loop over category index from 0 up to NUM_CATEGORIES and increment by 1
    for (let catIdx = 0; catIdx < NUM_CATEGORIES; catIdx++) {
// append a new table cell to the current table row with a unique ID and an icon representing a question
      $tr.append(
        $("<td>")
          .attr("id", `${catIdx}-${clueIdx}`)
          .append($("<i>").addClass("fas fa-question-circle fa-3x"))
      );
    }
    // append the table row to the table body with the id of jeopardy
    $("#jeopardy tbody").append($tr);
  }
}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

function handleClick(evt) {
    // create an alias for the target element of the event
  let $tgt = $(evt.target);
//   retrieve the value of the "id" attribute ("This is a common operation used to extract specific attribute values from DOM elements for further processing.") -> from chatGPT
  let id = $tgt.attr("id");
//   split the id into substrings using the "-". assign the first to catId, and the second to the clueId ("This is a common technique used to extract multiple values from a string into separate variables for further processing.")
  let [catId, clueId] = id.split("-");
//   get the clue from the categories array based on the categoryID and the clueID
  let clue = categories[catId].clues[clueId];

  let msg;

//   it the clue is not showing
  if (!clue.showing) {
    // create an alias for the clue.question
    msg = clue.question;
    // Set the 'showing' property of the clue to indicate that it is currently displaying its question
    // the clue is currently showing the question
    clue.showing = "question";
    // else if if the clue.showing is equal to the question
  } else if (clue.showing === "question") {
    // assign the message to the clue.answer (displays answer of clue)
    msg = clue.answer;
    // set the clue.showing to the answer (clue is now showing answer)
    clue.showing = "answer";
    // once the answer is showing you cannot hide it
    $tgt.addClass("disabled");
  } else {
    // already showing answer; ignore
    return;
  }

  // Update text of cell
  $tgt.html(msg);
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

function showLoadingView() {
  // clear the board
  $("#jeopardy thead").empty();
  $("#jeopardy tbody").empty();

  // show the loading icon
  $("#spin-container").show();
  $("#start")
    .addClass("disabled")
    .text("Loading...");
}

/** Remove the loading spinner and update the button used to fetch data. */

function hideLoadingView() {
  $("#start")
    .removeClass("disabled")
    .text("Restart!");
  $("#spin-container").hide();
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

async function setupAndStart() {
    // when started display "Loading"
  let isLoading = $("#start").text() === "Loading...";

//   if it is not loading
  if (!isLoading) {
    // show the loading view
    showLoadingView();

    // wait till everything is loaded then get the categoryId's and give it an alias
    let catIds = await getCategoryIds();

    // set categories to an empty array
    categories = [];

    // iterate over the categoryId's
    for (let catId of catIds) {
        // Asynchronously fetch category data from the server for the current category ID (catId)
// and push the retrieved category data onto the categories array
      categories.push(await getCategory(catId));
    }

    fillTable();
  }
}

/** On click of start / restart button, set up game. */

$("#start").on("click", setupAndStart);

/** On page load, add event handler for clicking clues */

$(async function() {
  $("#jeopardy").on("click", "td", handleClick);
});
