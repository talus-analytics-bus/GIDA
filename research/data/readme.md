# Overview

The data/ subdirectory includes the following folders:
* ihme/  
* crs/  
* foreign_assistance_gov/  
* gates_foundation/
* gavi/  
* gfinder/  
* oie/  
* who_global_health_expenditure / 
* aggregate/

The folders ihme, crs, foreign_assistance_gov, gavi, gfinder, oie, and who_global_health_expenditure all contain row and processed data from the datasources specified. Note that not all raw data has been pushed to git (intentionally, as these files can be large and do not need to be shared at this time). The folder aggregate/ contains aggregate data that incorporates data from ihme, gavi, gfinder, and oie (but not crs at this time). The code contained in another directory, src/, was used to process the data contained in the source-specific subfolders and generate the data contained in the aggregate folder.

The data/ subdirectory also includes the following files:  
**field_mapping.tsv:** indicates how individual fields in each dataset map to a set of conserved core data elements  
**agency_country_mapping.tsv:** identifies the countries associated with a subset of agencies included in demo dataset  
**demo_data.tsv:** dataset used for demo, combining both notional and actual data  

Specific Information regarding each subdirectory is included below.

# Data sources

## CRS

CRS data are not currently being used because data exporter tool does not function as expected, and returns partial data plus an error message (only reports net disbursements, but not commitments, and returns an error at the bottom of a large, but partial csv file).

**Subdirectory:** crs  
**Source:** OECD CRS (Organization for Economic Cooperation and Development Creditor Reporting System)  
**Dataset:** custom export using CRS Query Wizard, exact link and filters/structure provided in relevant subdirectory readme  
**Dataset details:** Recipient (Developing Countries, Total); Sector (13 Sectors from Health and Agriculture, additional detail providerd in subdirectory readme); Channel (All Channels); Flow Type (Commitments and Dispersements); Type of Aid (All Types, Total); Amount Type (Constant Prices); Unit (US Dollar, Millions, 2015)  
**Brief description:** Health and agricultural funding provided to developing countries from 102 unique donors including countries and organizations from 2010-2015.   
**Level of aggregation:** Funder, Flow Type (Disbursements vs. Commitments) country, geographic region, health focus area  
**General Location: https://stats.oecd.org/Index.aspx?DataSetCode=CRS1  
**Specific Location (using "query wizard"):** http://stats.oecd.org/qwids/#?x=5,1,2,3&y=6&f=4:1,7:1,9:85,8:85&q=4:1+7:1+9:85+8:85+5:3,4+1:3,4,5,6,58,7,8,9,10,11,59,60,12,13,14,61,15,16,17,18,62,19,63,75,20,21,22,23,24,36,209,195,197,169,190,70,204,176,170,171,172,173,174,175,191,69,67,205,64,76,211,47,212,213,30,31,214,32,33,215,43,44,34,202,35,179,216,203,72,48,206,68,49,73,194,50,51,52,181,53,55,74,217,218,41,42,45,219,199,196,177,200,71,37,38,198,39,40,178,193,77,78+2:2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,189,25,27,28,31,29,30,32,33,34,35,36,37,38,39,41,42,43,44,45,46,47,89,40,49,50,51,53,54,55,56,57,59,273,63,62,64,65,66,67,68,69,70,71,72,73,74,75,76,78,79,81,82,83,84,85,86,87,88,90,274,91,92,93,95,96,97,98,100,101,102,103,104,105,106,107,108,109,110,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,135,136,137,138,139,141,144,159,160,161,162,145,146,147,148,149,150,151,152,154,155,156,157,275,158,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,190,134,191,192,193+3:21,22,23,24,26,27,28,29,30,31,32,33,137+6:2010,2011,2012,2013,2014,2015&lock=CRS1

## foreign_assistance_gov

**Subdirectory:** foreign_assistance_gov  
**Source:** foreignassistance.gov   
**Dataset:** full foreignassistance.gov
**Dataset details:** award identifier, Award Title, Award Accountable Organization - Name, Award Accountable Organization - Office, Award Implementing Organization - Name, Award Implementing Organization - Address - Country Code, Award Implementing Organization - Address - Country, Award Total Estimated Value, Award Signing Date, Award Location - Name, Award Transaction - Disbursement Channel, Award Transaction - Sector, Treasury Account - Beginning Fiscal Funding Year, and others  
**Brief description:**  
**General Location: http://foreignassistance.gov/categories/Health#download  
**Data Obtained Date:** 8/14/2017  

## Gates Foundation

**Subdirectory:** gates_foundation  
**Source:** Bill and Melinda Gates Grants Database, 2017 Global Health Funding.   
**Dataset:** custom export using 2017 data for program == "Global Health".   
**Dataset details:** grantee, year, issue, program, amount.   
**Brief description:** Bill and Melinda Gates Foundation data for grants given in 2017 for "Global Health" purposes.   
**General Location: https://www.gatesfoundation.org/How-We-Work/Quick-Links/Grants-Database. 
**Data Obtained Date:** 8/14/2017  

## GAVI

**Subdirectory:** gavi  
**Source:** GAVI Vaccine Alliance  
**Dataset:** Commitments and Dispersements for All Countries for 2001-2017  
**Brief description:** GAVI provides information regarding all of its funding commitments and dispersements for vaccine-related initiatives.  
**Level of aggregation:** Funder (always GAVI), Recipient, Program, Year  
**Location:** http://www.gavi.org/results/disbursements/  
**Data Obtained Date:** 8/8/2017

## G-Finder

**Subdirectory:** gfinder  
**Source:** Policy Cures G-Finder  
**Dataset:** Neglected Disease Funding for all diseases - all products for FYI 2015  
**Brief description:** The G-Finder database provides information on funding for 35 neglected diseases across 142 product areas including drugs, vaccines, diagnostics, microbicides, and vector control products. Data are collected by survey and manually collated and reviewed by the Policy Cures team.  
**Level of aggregation:** Disease, Secondary-level Disease, Product, Funder, Funding Type, Recipeint, Year  
**Location:** https://gfinder.policycuresresearch.org/PublicSearchTool/  
**Data Obtained Date:** 8/8/2017  
**Note:** wasn't able to successfully export all data for all years without crashing G-Finder site, selected FYI 2015 only 

## IHME

**Subdirectory:** ihme  
**Source:** IHME (Institute for Health Metrics and Evaluation, University of Washington)  
**Dataset:** Development Assistance for Health Database 1990-2016  
**Brief description:** Information on global health assistance during the timeframe specified, based on data obtained from project databases, financial statements, annual reports, IRS 990s, and correspondence with agencies.  
**Level of aggregation:** Funding agency, country, geographic region, health focus area  
**Monetary reporting:** adjusted to 2015 USD  
**Location:** http://ghdx.healthdata.org/record/development-assistance-health-database-1990-2016  
**Data Obtained Date:** 8/7/2017

## OIE

OIE data were manually extracted from a pdf, and include information regarding programs funded by the EU only.  

**Subdirectory:** oie  
**Source:** OIE (World Organization for Animal Health)  
**Dataset:** OIE Procurement Contracts, Grants and Sub-Grants awarded by the OIE with funding by the European Union (EU)  
**Brief description:** All active contribution agreements signed between the OIE and the EU in support of OIE programs, project, and activities. EU Only.  
**Level of aggregation:** Funder (always EU), Recipient, Program, Year  
**Location:** http://www.oie.int/fileadmin/Home/eng/Support_to_OIE_Members/pdf/EU_Procurement-contracts-and-Grants-published_SEP-2016_01.pdf  
**Data Obtained Date:** 8/8/2017

## WHO Global Health Expenditure Database

WHO Global Health Expenditure data are not currently being used because data exporter tool, as data are not reported at the appropriate level of resolution. These data are aggregated by recipient, and have no information on donor (other than separatiing public vs. private donors). 

**Subdirectory:**  who_global_health_expenditure  
**Source:** WHO Global Health Expenditure Database (2014 only)
**Dataset:** custom export using 2014 data
**Dataset details:** Country, general government expenditure on health (millions of 2017 USD), private expenditure on health (millions of 2017 USD)
**Brief description:** High level summary of government vs. private expenditures on health, per country, reported in 2017 USD. Values for 2014 only. Data 
**General Location: http://apps.who.int/nha/database/ViewData/Indicators/en  
**Data Obtained Date:** 8/14/2017  
