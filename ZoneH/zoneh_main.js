const puppeteer = require('puppeteer');
const fs =require('fs');
const delimiter = ";";
const output_filename = "array.csv";   // #TOCHANGE

/* Variables */
const num_of_pages = 2;		//number of pages of zone-h to enumerate
const url = "https://zone-h.org/archive/filter=1/filter_date_select=week/page="

/* Generate Random number */
function getRandomInt(min, max){
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random()*(max-min))+min;
}

/* File Operations */
var file = fs.createWriteStream(output_filename, {flags:'a'});
file.on('error', function(err) { /* error handling */ });
// Write to file the CSV Header
file.write("Date;Notifier;H;M;R;L;;Domain;OS;View" + '\n'); 


void (async () => {

	const browser = await puppeteer.launch(
	{
		headless: false,
		defaultViewport: {width: 1280, height: 800},
		args: ['--no-sandbox','--proxy-server=socks5://localhost:9150']
	});

	const page = (await browser.pages())[0];

	for(count=1; count <=num_of_pages; count++){
		var visit_url = url+count.toString();
		await page.goto(visit_url);   
		// Incase got CAPTCHA, this selector will wait 
		// until CAPTCHA is entered correctly before proceeding
		await page.waitForSelector("#ldeface", {timeout:0});
		// Wait for a random delay	
		await page.waitFor(getRandomInt(1000,5000));

		const table = await page.evaluate(()=> {
					
			const data = [];
			const tableRows = document.querySelectorAll('#ldeface >tbody> tr');

			for (const tr of tableRows) {
				const datarow=[];
				var nodes = tr.querySelectorAll('td');

				for (item of nodes){
					if(item.querySelector('img')){
						datarow.push(item.querySelector('img').title)
					}
					else if(item.textContent == "mirror"){
						datarow.push(item.querySelector('a').href);
					}
					else
						datarow.push(item.innerText);
				}
				data.push(datarow);
				
			}

			return data
		});

		console.log(visit_url + " --> "+table.length);

		/* Write the data from each table into the CSV FILE*/
		table.forEach(function(v) { 
			if( v.toString().startsWith("2020") && !v.toString().match(/\d{1,2} \d{1,2} \d{1,2} \d{1,2}/g) && v!= "DISCLAIMER: all the information contained in Zone-H's cybercrime archive were either collected online from public sources or directly notified anonymously to us. Zone-H is neither responsible for the reported computer crimes nor it is directly or indirectly involved with them. You might find some offensive contents in the mirrored defacements. Zone-H didn't produce them so we cannot be responsible for such contents. Read more")
			file.write(v.join(delimiter) + '\n'); 

		});
	}

	file.end();	
	browser.close();

})();
