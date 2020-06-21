const puppeteer = require('puppeteer');
const fs = require('fs');
const delimiter = ";";
const output_filename = "mirror.csv";   // #TOCHANGE
const input_url_file = "urllist.txt"    // #TOCHANGE
const output_dir = 'captured_screenshots/';

/* File Operations */
var file = fs.createWriteStream(output_filename, {flags:'a'});
file.on('error', function(err) { /* error handling */ });

// Write to file the CSV Header
file.write("URL;Mirror saved on;Notifier;Domain;IP;Country;System;Web server;MirrorLink" + '\n'); 

// Create output directory to save screenshot if does not exist
if (!fs.existsSync(output_dir)){
    fs.mkdirSync(output_dir);
}

/* Generate Random number */
function getRandomInt(min, max){
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random()*(max-min))+min;
}

// Read the URL list
var readURL = fs.readFileSync(input_url_file, 'utf8').split('\n');

async function run() {

  const browser = await puppeteer.launch(
  {
    headless: false,
    defaultViewport: {width: 1280, height: 800},
    args: ['--no-sandbox','--proxy-server=socks5://localhost:9150']
  });

  let page = await browser.newPage();

  	for (item of readURL){
		var filename = item.replace(/\//g,"_").replace(".","_").replace(":","_");

    await page.goto(item);
    // Incase got CAPTCHA, this selector will wait 
    // until CAPTCHA is entered correctly before proceeding    
    await page.waitForSelector("li.deface0", {timeout:0});
    await page.screenshot({ path: output_dir+filename+".jpg", type: 'jpeg' });

    const table = await page.evaluate((weblink)=> {
      // Extract the fields on the mirror page
      const data = [];
      const saveon = document.querySelector('#propdeface > ul > li:nth-child(1)');
      const notifier = document.querySelector('#propdeface > ul > li:nth-child(2) > ul > li.defacef');
      const domain = document.querySelector('#propdeface > ul > li:nth-child(2) > ul > li.defaces');
      const ip_addr = document.querySelector('#propdeface > ul > li:nth-child(2) > ul > li.defacet');
      const country = document.querySelector('#propdeface > ul > li:nth-child(2) > ul > li.defacet > img');
      const system = document.querySelector('#propdeface > ul > li:nth-child(3) > ul > li.defacef');
      const webserver = document.querySelector('#propdeface > ul > li:nth-child(3) > ul > li.defaces');
      const frame = document.querySelector('#propdeface > iframe');

      data.push(weblink.trim());
      data.push(saveon.textContent.trim().replace("Mirror saved on: ",""));
      data.push(notifier.textContent.trim().replace("Notified by: ", ""));
      data.push(domain.textContent.trim().replace("Domain: ",""));
      data.push(ip_addr.textContent.trim().replace("IP address: ",""));
      data.push(country.alt.trim());
      data.push(system.textContent.trim().replace("System: ", ""));
      data.push(webserver.textContent.trim().replace("Web server: ",""));
      data.push(frame.src);
      return data
    },item);

    //console.log(table);
    console.log(filename);

    /* Write the data from each table into the CSV FILE*/
    file.write(table.join(delimiter) + '\n'); 
    await page.waitFor(getRandomInt(5000,10000));
  }

   await page.close();
   await browser.close();
}

run();
