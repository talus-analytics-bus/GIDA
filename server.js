// NodeJS script for starting server and listening for HTTP requests
const app = require('express')();
const server = require('http').Server(app);
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');


const formidable = require('formidable');
const useHTTPSRedirection = process.env.USE_HTTPS_REDIRECTION || 'false';



// Set the useHTTPSRedirection to false if you don't want the auto-redirection from HTTP to HTTPS
if (useHTTPSRedirection === 'true') {
  // Redirect HTTP to HTTPS
  app.use(function(req, res, next) {
    if((!req.secure) && (req.get('X-Forwarded-Proto') !== 'https')) {
      res.redirect('https://' + req.get('Host') + req.url);
    }
    else
    next();
  });
}

// if no hash, send to index
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/', 'index.html'));
});

// if hash, send to requested resource
app.get(/^(.+)$/, function(req, res) {
  res.sendFile(path.join(__dirname, '/', req.params[0]));
});

// data export XLSX
// if no hash, send to index
app.use(bodyParser.json({limit: '500Mb'}));
app.post('/download_data', function(req, res) {
  req.connection.setTimeout(100000); //100 seconds
  console.log("Running download_data now")
  const xl = require('xlsx-populate');

  // Load template xlsx file
  const templateFn = './export/GIDA - Data Export Template.xlsx';
  xl.fromFileAsync(templateFn)
  .then(wb => {
    // Define constants
    const headerRow = 5;
    const startRow = headerRow + 1;
    const subtitleCell = "A2";
    const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const today = new Date();
  wb.definedName('subtitle').value(`Downloaded on ${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`);

  // Process data for certain fields, if needed
  // Core Capacities - Merge into single cell
  // Amount committed / Amount disbursed - Include currency (one col)
  // Project year range - Calculate from transactions (maybe do client-side)

  // Add data
  // const debugCols = [{name: 'project_name'}];
  // const exportCols = debugCols;
  const unspecifiedValues = ['', null, undefined];
  const exportCols = req.body.params.exportCols;
  const hideCols = req.body.params.hideCols;
  hideCols.forEach(col => {
    wb.definedName(col).hidden(true);
  });
  const moneyFunc = function (datum, col, field) {
    if (datum.within_data_years === false) return req.body.params.outsideYearRangeText;
    else return datum[field];
  };
  const exportColFuncs = {
    total_committed: function (datum, col) { return moneyFunc(datum, col, 'total_committed'); },
    total_spent: function (datum, col) { return moneyFunc(datum, col, 'total_spent'); },
    project_description: function (datum, col) {
      if (datum.source.name !== 'IATI via D-Portal') {
        if (unspecifiedValues.includes(datum[col.name])) return null;
        else return datum[col.name];
      } else return 'n/a (descriptions not available for IATI projects)';
    },
    core_capacities: function (datum, col) {
      const colData = datum[col.name].filter(d => d !== '');
      if (colData && colData.length > 0) {
        return colData.map(id => {
          if (id === 'POE') return col.params.capacitiesDict['PoE'].name;
          else return col.params.capacitiesDict[id].name
        }).join(';\n');
      } else return null;
    },
    recipient_name: function (datum, col) {
      if (datum.recipient_name_orig !== undefined) return datum.recipient_name_orig;
      const colData = datum[col.name];
      if (!unspecifiedValues.includes(colData)) return colData;
      else return null;
    },
    donor_name: function (datum, col) {
      if (datum.donor_name_orig !== undefined) return datum.donor_name_orig;
      const colData = datum[col.name];
      if (!unspecifiedValues.includes(colData)) return colData;
      else return null;
    },
    donor_code: function (datum, col) {
      const colData = datum[col.name];
      if (datum.donor_name_orig !== undefined) return 'Multiple';
      if (!unspecifiedValues.includes(colData)) {
        if (datum.donor_sector === 'Government') {
          return col.params.codeToNameMap['$' + colData];
        } else return 'n/a';
      } else return null;
    },
    donor_sector: function (datum, col) {
      if (datum.donor_name_orig !== undefined) return 'Multiple';
      const colData = datum[col.name];
      if (!unspecifiedValues.includes(colData)) {
        if (colData === 'Country') {
          return 'Government';
        } else return colData;
      } else return null;
    },
    recipient_sector: function (datum, col) {
      if (datum.recipient_name_orig !== undefined) return 'Multiple';
      const colData = datum[col.name];
      if (!unspecifiedValues.includes(colData)) {
        if (colData === 'Country') {
          return 'Government';
        } else return colData;
      } else return null;
    },
    recipient_country: function (datum, col) {
      if (datum.recipient_name_orig !== undefined) return 'Multiple';
      const colData = datum[col.name];
      if (!unspecifiedValues.includes(colData)) {
        if (datum.recipient_sector === 'Country' || datum.recipient_sector === 'Government') {
          return col.params.codeToNameMap['$' + colData];
        } else return 'n/a';
      } else return null;
    },
    source: function (datum, col) {
      const colData = datum[col.name];
      if (!unspecifiedValues.includes(colData)) {
        return colData.name;
      } else return null;
    },
    currency: function (datum, col) {
      if (datum.assistance_type && datum.assistance_type === 'In-kind support') {
        return 'n/a';
      }
      if (datum.total_spent !== undefined || datum.total_committed !== undefined) {
        return col.params.currencyIso;
      } else return null;
    },
    year_range: function (datum, col) {
      const t = datum.transactions;
      if (t.length > 0) {
        const min = Math.min(...t.map(tt => {
          if (tt.cy === '') return Infinity;
          if (+tt.cy > +col.params.dataEndYear) {
            return Infinity;
          } else return +tt.cy;
        }
        )
        );
        const max = Math.max(...t.map(tt => {
          if (tt.cy === '') return -Infinity;
          if (+tt.cy > +col.params.dataEndYear) {
            return -Infinity;
          } else return +tt.cy;
        }
        )
        );
        if (min === Infinity || max === -Infinity) return null;
        if (min === max) return min;
        else return `${min} - ${max}`;
      } else return null;
    },
  };

const exportData = req.body.params.exportData;
exportCols.forEach(col => {
  for (let i = 0; i < exportData.length; i++) {
    // formatting row
    const datum = exportData[i];
    const func = col.func ? exportColFuncs[col.name] : (datum, col) => {
      const colData = datum[col.name];
      if (!unspecifiedValues.includes(colData)) {
        return colData;
      } else return null;
    };
    let cellValue = func(datum, col);
    if (cellValue === null) cellValue = col.noDataText;

    // populate cell
    wb.definedName(col.name).cell(startRow).relativeCell(i,0).value(cellValue);
    }
  });

  // Hide unused rows


  // Download report
  wb.outputAsync()
  .then(function (blob) {
    res.end(blob);
  });
});
});

// If enableS3 is true, then the aws-sdk package will be loaded (can cause some
// Mac machines to crash). This package is required for the "Submit Data" page
// and functions on that page will fail unless it is true.
// To run locally, disable S3, otherwise you will receive a Node.js error about credentials not being correct
//
const enableS3 = process.env.ENABLE_S3_BUCKET || 'false';
if (enableS3 === 'true') {
  const aws = require('aws-sdk');
  aws.config.loadFromPath('./config/config.json');
  const s3 = new aws.S3({ apiVersion: '2006-03-01' });

  // uploading report to s3 bucket
  app.post('/upload-s3', function(req, res) {
    const form = new formidable.IncomingForm();

    form.on('error', function(err) {
      console.log('Error processing file...', err);
    });

    // parse form and upload to S3 bucket
    form.parse(req, function(err, fields, files) {
      const file = files.upload;

      // construct tags
      const tags = 'firstname=' + fields.firstname;
      tags += '&lastname=' + fields.lastname;
      tags += '&organization=' + fields.org;
      tags += '&email=' + fields.email;

      // validate file type and size
      const fileNameArr = file.name.split('.');
      const fileType = fileNameArr[fileNameArr.length - 1];
      if (fileType !== 'xls' && fileType !== 'xlsx') {
        res.status(500).json({ error: 'File type is not valid: ' + fileType });
        return;
      }
      if (file.size > 100e6) {
        res.status(500).json({ error: 'File size is over 100 MB: ' + file.size });
        return;
      }

      // set up parameters object
      console.log(file);
      const uploadParams = {
        Bucket: 'ghs-tracking-dashboard',
        Tagging: tags,
        Key: path.basename(file.path) + '.' + fileType,
        Body: '',
      };

      // read file
      const fileStream = fs.createReadStream(file.path);
      fileStream.on('error', (err) => {
        console.log('File Error', err);
      });
      uploadParams.Body = fileStream;

      // start upload to s3
      s3.upload(uploadParams, (err, data) => {
        if (err) {
          console.log('Error uploading to S3: ', err);
          res.status(500).json({ error: err });
        }
        if (data) {
          console.log('Success uploading to S3: ', data.Location);
          res.status(200).json({ location: data.Location });
        }
      });
    });
  });
}


// Start the HTTP Server
server.listen(process.env.PORT || 8081, function() {
  console.log('Server set up!');
  console.log(server.address());
});

//server.timeout = 900000;
