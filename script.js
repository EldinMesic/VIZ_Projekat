//Fetch Data
function fetchData(){
    var response = [];
    response.push(fetch("/csvjson.json").then((response) => response.json()));
    Promise.all(response).then(results => {
        results[0].forEach(result => {

            var deathInfo = {
                year: result.Year,
                deathCounts: [
                    {name: "Menignitis", count: result["Meningitis"]},
                    {name: "Alzheimer's Disease and Other Dementias", count: result["Alzheimer's Disease and Other Dementias"]},
                    {name: "Parkinson's Disease", count: result["Parkinson's Disease"]},
                    {name: "Nutritional Deficiencies", count: result["Nutritional Deficiencies"]},
                    {name: "Malaria", count: result["Malaria"]},
                    {name: "Drowning", count: result["Drowning"]},
                    {name: "Interpersonal Violence", count: result["Interpersonal Violence"]},
                    {name: "HIV/AIDS", count: result["HIV/AIDS"]},
                    {name: "Drug Use Disorders", count: result["Drug Use Disorders"]},
                    {name: "Tuberculosis", count: result["Tuberculosis"]},
                    {name: "Cardiovascular Diseases", count: result["Cardiovascular Diseases"]},
                    {name: "Lower Respiratory Infections", count: result["Lower Respiratory Infections"]},
                    {name: "Neonatal Disorders", count: result["Neonatal Disorders"]},
                    {name: "Self-harm", count: result["Self-harm"]},
                    {name: "Environmental Heat and Cold Exposure", count: result["Environmental Heat and Cold Exposure"]},
                    {name: "Neoplasms", count: result["Neoplasms"]},
                    {name: "Conflict and Terrorism", count: result["Conflict and Terrorism"]},
                    {name: "Diabetes Mellitus", count: result["Diabetes Mellitus"]},
                    {name: "Road Injuries", count: result["Road Injuries"]},
                    {name: "Chronic Respiratory Diseases", count: result["Chronic Respiratory Diseases"]},    
                ]
                
            }
            var found = deathData.find( el => el.name == result["Country/Territory"]); 
            if(!found){
                found =
                    {
                        name: result["Country/Territory"],
                        code: result.Code,
                        deaths: [deathInfo]
                    };
                deathData.push(found);        
            }else{
                found.deaths.push(deathInfo);
            }
            
        });
    });
}


//Draw Select Map
function selectMap(){
    //attributes
    var width = 960;
    var height = 650;


    //define path and projection
    var projection = d3.geo.mercator()
    .scale(153)
    .translate([width / 2, height / 1.4]);

    var path = d3.geo.path()
    .projection(projection);



    //create svg
    var svg = d3.select("#select-map")
        .attr("width", width)
        .attr("height", height)
        .style("background", "lightblue")
        .call(d3.behavior.zoom().scaleExtent([1, 10])
            .on("zoom", function(){
                svg.attr("transform", "scale (" + d3.event.scale + ") translate(" + d3.event.translate + ")");
            }))
        .call(d3.behavior.drag()
            .on("drag", function(){
                
            }))
        .append("g");

    
    //create countries
    d3.json("worldTopo.json", function (error, world) {
        var data = topojson.feature(world, world.objects.countries1);
        var states = svg.selectAll("path.county")
            .data(data.features)
            .enter()
            .append("path")
            .attr("class", "country")
            .attr("id", function (d) { return d.id; })
            .attr("d", path)
            .style("stroke", "black")
            .style("stroke-width", 1)
            .style("stroke-opacity", 1)
            .on("mouseover", function (d) {
                var country = deathData.find(element => element.code == d.id);
                if(country)
                    totalDeaths(country);
            })
    });
        

}
//Draw Total Deaths Graph
function totalDeaths(selectedCountry){
    //variables
    var margin = {top: 50, bottom: 70, left: 120, right: 20};
    var width = 1200 - margin.left - margin.right;
    var height = 700 - margin.top - margin.bottom;


    //look
    var colors = d3.scale.linear()
        .domain([1, 20])
        .range(["blue","red"]);



    //date parsing
    var parseDate = d3.time.format("%Y").parse;
    var minDate = new Date("01-Jan-1998");
    var maxDate = new Date("01-Jan-2018");



    //define x-axis
    var x = d3.time.scale()
        .domain([minDate, maxDate])
        .rangeRound([0, width]);


    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .ticks(21);
        console.log(selectedCountry.deaths.length);


    //define y-axis
    var y = d3.scale.linear()
        .domain([0, d3.max(selectedCountry.deaths, function(d) { 
            return d3.max(d.deathCounts, function(de) {
                return de.count;
            })
        })])
        .range([height, 0]);
    
    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(10);


    d3.select("#country-total-deaths-graph").text("");
    //create svg
    var svg = d3.select("#country-total-deaths-graph")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.bottom + margin.top)
        .style("background-color", "lightblue")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top +")");

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "middle");

    svg.append("text")
        .attr("x", (width / 2))
        .attr("y", -(margin.top / 2))
        .attr("font-weight", "bold")
        .style("font-size", "20px")
        .style("text-anchor", "middle")
        .text(`${selectedCountry.name} - Broj umrlih od svih uzroka smrti po godinama`);
        
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(height / 2))
        .attr("y", -((margin.left / 2) + 20))
        .style("text-anchor", "middle")
        .text("Broj oboljelih")
        .style("font-size", "13px")

    svg.append("text")
        .attr("x", (width / 2))
        .attr("y", (height + (margin.bottom / 2)))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Datum");
    
    


}



//Global Variables
var deathData = [];




//Execute Code
fetchData();
selectMap();
