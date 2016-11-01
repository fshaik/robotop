
const scrapeIt = require("scrape-it");


function getStatus(url) {
		scrapeIt(url, {
		title: "title",
		desc: ".header h2",
		currentStatus: "#content > div.titleStripe > div > div:nth-child(1) > div.col-xs-12.col-sm-7.col-md-7.col-lg-7 > div > div > h2"

	}, (err, page) => {
	    //console.log(page.currentStatus);
	    return(page.currentStatus)
	});

}



function checkTrainStatus (train) {

	if(train) {
		switch (train) {
			case "L" :
				var status = getStatus("http://subwaystats.com/status-L-train");
				console.log("HELLO")
				return status;
			break;

			default:
				getStatus();
			break;

		}
	}



}

var status = checkTrainStatus ("L");
console.log(status)
