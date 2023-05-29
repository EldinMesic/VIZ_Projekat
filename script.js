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
        deathData.forEach(country => country.deaths.sort((a,b) => a.year - b.year));
        drawSelectMap();
    });
}


//Draw Select Map
function drawSelectMap(){
    //attributes
    var width = screen.width*0.7;
    var height = parseInt(width*0.7);


    //define path and projection
    var projection = d3.geo.mercator()
    .scale(185)
    .translate([width / 2, height / 1.45]);

    var path = d3.geo.path()
    .projection(projection);


    //colors
    var totalDeathsScale = d3.scale.linear().domain([100000, 10000000]).range([1, 10]);
    var myColor = d3.scale.linear().domain([1, 10])
        .range(["white", "darkred"]);


    //create svg
    var svg = d3.select("#select-map")
        .attr("width", width)
        .attr("height", height)
        .call(d3.behavior.zoom().scaleExtent([1, 10])
            .on("zoom", function(){
                svg.attr("transform", "scale (" + d3.event.scale + ") translate("+ d3.event.translate +")");
                svg.selectAll(".country")
                    .style("stroke-width", (1/d3.event.scale).toFixed(2).toString() + "px");
                if(d3.event.scale == 1){
                    svg.attr("transform", "translate(0,0)");
                    d3.event.translate = [0,0];
                }
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
            .style("fill", (d) => {
                var country = deathData.find(element => element.code == d.id);
                if(country){
                    var totalDeaths = 0;
                    country.deaths.forEach(el => totalDeaths+=el.deathCounts.reduce((a,b) => a+b.count, 0));
                    if(totalDeaths>20000000){
                        return "#5b0000";
                    }
                    return myColor(totalDeathsScale(totalDeaths));
                    
                }
            })
            .style("stroke", "black")
            .style("stroke-width", 1)
            .style("fill-opacity", 0.8)
            .style("stroke-opacity", 1)
            .on("mouseover", (d) => {
                var country = deathData.find(element => element.code == d.id);

                if(country){
                    svg.select(`#${d.id}`)
                    .transition().duration(250)
                        .style("fill-opacity", 1)
                        .style("stroke-width", 4);

                    d3.select(".tooltip")
                    .style("visibility", "visible")
                    .style("left", `${d3.event.pageX+1}px`)
                    .style("top", `${d3.event.pageY+1}px`)
                    .text(`Country: \n${country.name}`)
                }
            })
            .on("mouseout", (d) => {
                var country = deathData.find(element => element.code == d.id);

                if(country){
                    svg.select(`#${d.id}`)
                        .transition().duration(250)
                            .style("fill-opacity", 0.8)
                            .style("stroke-width", 1);

                    d3.select(".tooltip")
                        .style("visibility", "hidden")
                }
            })
            .on("click", function(d){
                var country = deathData.find(element => element.code == d.id);
                if(country){
                    d3.select("#country-info-container").style("visibility", "visible");
                    drawTotalDeathsLineChart(deathData.find(el => el.code == d.id), 1999, 2018);
                }

            });
    });
        

}
//Draw Total Deaths Line Chart
function drawTotalDeathsLineChart(selectedCountry, minYears, maxYears){

    //preperations
    filteredDeathData = selectedCountry.deaths.filter(country => country.year>=minYears && country.year<=maxYears);

    //variables
    var margin = {top: 50, bottom: 70, left: 90, right: 20};
    var width = screen.width*0.5 - margin.left - margin.right;
    var height = width*0.6 - margin.top - margin.bottom;



    //date parsing
    var parseDate = d3.time.format("%Y").parse;
    var minDate = new Date(`01-Jan-${minYears}`);
    var maxDate = new Date(`01-Jan-${maxYears}`);



    //define x-axis
    var x = d3.time.scale()
        .domain([minDate, maxDate])
        .rangeRound([0, width]);


    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .ticks(filteredDeathData.length);



    //define y-axis
    var y = d3.scale.linear()
        .domain([
            d3.min(filteredDeathData, function(d) {
                return d.deathCounts.reduce((a,b) => a+b.count, 0);
            })*0.95
            , 
            d3.max(filteredDeathData, function(d) { 
                return d.deathCounts.reduce((a,b) => a+b.count, 0);
            })*1.05
        ])
        .range([height, 0]);
    
    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(10);




    //clear past svgs    
    d3.select("#country-total-deaths-graph").text("");
    
    //create svgs
    var svg = d3.select("#country-total-deaths-graph")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.bottom + margin.top)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top +")");
    svg.append("text")
        .attr("x", (width / 2))
        .attr("y", -(margin.top / 2))
        .attr("font-weight", "bold")
        .style("font-size", "14px")
        .style("text-anchor", "middle")
        .text(`${selectedCountry.name} - Stopa mortaliteta od neprirodnih uzroka smrti`);
        

        //x axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("transform", "translate(20, 15) rotate(45)");
    svg.append("text")
        .attr("x", (width / 2))
        .attr("y", (height + (margin.bottom / 2)))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Godina");

        //y axis
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(height / 2))
        .attr("y", -((margin.left / 2) + 20))
        .style("text-anchor", "middle")
        .text("Broj umrlih")
        .style("font-size", "13px")



    //chart values
    var valueline = d3.svg.line()
        .x(function(d) { return x(parseDate(d.year.toString())); })
        .y(function(d) { return y(d.deathCounts.reduce((a,b) => a+b.count, 0)); });
        
    var linechart = svg.append("path")
        .attr("class", "line")
        .attr("d", valueline(filteredDeathData))
        .style("stroke","blue")
        .attr("fill","none")
        .style("stroke-width", "1px");


    //mouseover transition and tooltip control
    filteredDeathData.forEach((item, k) => {
        var deathCount = item.deathCounts.reduce((a,b) => a+b.count, 0)

        svg.append("circle")
            .attr("id", "circle-"+k)
            .attr("r", 5)
            .attr("cx", () => x(parseDate(item.year.toString())))
            .attr("cy", () => y(deathCount))
            .style("fill", "darkblue")
            .on("mouseenter", () => {
                d3.select(".tooltip")
                    .style("visibility", "visible")
                    .style("left", `${d3.event.pageX+1}px`)
                    .style("top", `${d3.event.pageY+1}px`)
                    .text(`Year: ${item.year.toString()}\n${parseInt(deathCount).toLocaleString()}`)
                    
                d3.select("#circle-"+k)
                    .transition()
                    .attr("r", 13)
                    .style("fill", "darkred")
                    .style("cursor", "pointer");
                })
            .on("mouseout", () => {
                d3.select(".tooltip")
                    .style("visibility", "hidden")

                d3.select("#circle-"+k)
                .transition()
                .attr("r", 5)
                .style("fill", "darkblue")
            });

    })

}



//Global Variables
var deathData = [];


//Execute Code
fetchData();

