var punchcard = (function () {
    var es = {};
    var width, height, margin, svg, svgID, custom_start_year,
        custom_end_year, d3DateFormat, dataDateFormat, customTickFormat;

    //initiate the D3 svg
    es.init = function(){
        //charts margin
        //accessible right before punchcard.init()
        //e.g. punchcard.top = 100
        margin = {
            top: punchcard.top || 50,
            right: punchcard.right || 200,
            bottom: punchcard.bottom || 0,
            left: punchcard.left || 40
        };

        width = punchcard.width || 500;
        height = punchcard.height || 500;

        d3DateFormat = punchcard.d3DateFormat || "%Y-%m-%d";
        dataDateFormat = punchcard.dataDateFormat || "YY-MM-DD";
        customTickFormat = punchcard.customTickFormat || "%m";
        
        svgID = punchcard.svgID || "punchCard";

        var format = d3.time.format(d3DateFormat).parse;
        //set the start and end year-month
        if (punchcard.custom_start_year){
            custom_start_year = format(punchcard.custom_start_year);
        }else{
            custom_start_year = format("2015-01");
        }
        if (punchcard.custom_end_year){
            custom_end_year = format(punchcard.custom_end_year);
        }else{
            custom_end_year = format("2015-12");
        }

        //remove the previous chart (svg)
        //in case init is being called twice
        //with different settings
        //by default it removes all svg elements
        //possible to remove by chart ID if it is set
        //e.g. d3.select(svgID).remove()
        d3.select("svg").remove();


        svg = d3.select("#punchcard-mount-point").append("svg")
            .attr("id", svgID)
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .style("margin-left", margin.left + "px")
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    };

    es.draw = function(esData) {

        this.esData = esData;
        console.log(this.esData);

        //depends on your data but you can clean it up here
        var data = esData['aggs']['keywords']['buckets'];

        //clean the current punchcard in case data is dynamically called punchcard.draw(data)
        svg.selectAll("circle").remove();
        svg.selectAll("text").remove();

        //format the date for D3 chart
        var format = d3.time.format(d3DateFormat).parse;
        //coloring the chart
        var c = d3.scale.category10();

        var x = d3.scale.linear()
            .range([0, window.width]);

        var xScale = d3.time.scale()
            .domain([custom_start_year, custom_end_year])
            .range([0, width]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("top")
            .scale(xScale)
            .tickFormat(d3.time.format(customTickFormat));

        svg.append("g")
            .attr("class", "x axis")
            .call(xAxis);
        for (var j = 0; j < data.length; j++) {
            var g = svg.append("g").attr("class", "journal");
            var circles = g.selectAll("circle")
                .data(data[j]['monthly']['buckets'])
                .enter()
                .append("circle");

            var text = g.selectAll("text")
                .data(data[j]['monthly']['buckets'])
                .enter()
                .append("text");

            var rScale = d3.scale.linear()
                .domain([0, d3.max(data[j]['monthly']['buckets'], function (d) {
                    return d['doc_count'];
                })])
                .range([2, 12]);

            circles
                .attr("cx", function (d, i) {
                    return xScale(format(moment(d['key']).format(dataDateFormat)));
                })
                .attr("cy", j * 30 + 20)
                .attr("r", function (d) {
                    return rScale(d['doc_count']);
                })
                .style("fill", function (d) {
                    return c(j);
                });

            text
                .attr("y", j * 30 + 25)
                .attr("x", function (d, i) {
                    return xScale(format(moment(d['key']).format(dataDateFormat))) - 8;
                })
                .attr("class", "value")
                .text(function (d) {
                    if (d['doc_count'] < 1000) {
                        return (d['doc_count']);
                    } else if (d['doc_count'] >= 1000) {
                        return (((d['doc_count']) / 1000).toFixed(2) + 'K');
                    }
                })
                .style("fill", function (d) {
                    return c(j);
                })
                .style("display", "none");

            g.append("text")
                .attr("y", j * 30 + 25)
                .attr("x", width + 50)
                .attr("class", "label")
                .text(truncate(data[j]['key'], 55, "..."))
                .style("fill", function (d) {
                    return c(j);
                })
                .on("mouseover", mouseover)
                .on("mouseout", mouseout)
                .on("click", function () {
                    //if (d3.event.defaultPrevented) return; // click suppressed
                    $('#searchQuery').val(d3.select(this).text());
                    $("#btnMainSearch").click();
                    d3.selectAll("text").on('click', null);
                });

        }
    };

    function truncate(str, maxLength, suffix) {
        if(str.length > maxLength) {
            str = str.substring(0, maxLength + 1);
            str = str.substring(0, Math.min(str.length, str.lastIndexOf(" ")));
            str = str + suffix;
        }
        return str;
    }
    function mouseover() {
        var g = d3.select(this).node().parentNode;
        d3.select(g).selectAll("circle").style("display","none");
        d3.select(g).selectAll("text.value").style("display","block");
    }
    function mouseout() {
        var g = d3.select(this).node().parentNode;
        d3.select(g).selectAll("circle").style("display","block");
        d3.select(g).selectAll("text.value").style("display","none");
    }

    return es;
})();