/**
 * Visual Timeline JavaScript Library v0.1
 *
 * Usage:

 *      
 *  AUTHOR: Zeek Wang
 *  Create: 2014/08/15
 */

(function(){
    var VTL = function() {}

    VTL.create = function(userConfig) {
        var TL = function() {};
        var duration = 1000;
        var config, container, margin, 
            containerSize, containerSize, graphSize, 
            graphType;
        var xAxisOrient, yAxisOrient;
        var xMin = null, xMax = null, yMin = null, yMax = null;
        var xDataMin, xDataMax, yDataMin, yDataMax;
        var xScale, yScale;
        var xTicksCount = 10, yTicksCount = 10;
        var xTicksFormat = null, yTicksFormat = null
        var axisEnabled, brushEnabled, valueHintEnabled;
        var xAxisEnabled, yAxisEnabled;
        var svg, group, gpGraph, gpBrush, gpHint;
        var data;
        var brush, brushEndCallback;
        var horizontalBandCount, horizontalHeight;
        var gradientColor = function(t) {
            return d3.hsl(150 + t * 60, 0.566, 0.629);
        }

        init(userConfig);

        function init(userConfig) {


            container = null;
            axisEnabled = true;
            brushEnabled = false;
            valueHintEnabled = false;
            xAxisEnabled = true;
            yAxisEnabled = true;
            xAxisOrient = "bottom";
            yAxisOrient = "left";
            xMin = null;
            xMax = null;
            yMin = null;
            yMax = null;
            margin = {
                left: 0,
                right: 0,
                top: 0,
                bottom: 0
            }

            config = {};
            // config = userConfig;

            if (userConfig.container == null) {
                console.log("VisTimeline Error: The container is not defined");
                return false;
            }
            if (userConfig.graphType == null) {
                console.log("VisTimeline Error: The graphType is not defined");
                return false;
            }            
            container = config.container = userConfig.container;
            graphType = config.graphType = userConfig.graphType;

            if (userConfig.margin != null) 
                margin = userConfig.margin;
            if (userConfig.xMin != null)
                xMin = userConfig.xMin;
            if (userConfig.xMax != null)
                xMax = userConfig.xMax;
            if (userConfig.yMin != null)
                yMin = userConfig.yMin;
            if (userConfig.yMax != null)
                yMax = userConfig.yMax;
            if (userConfig.axisEnabled != null)
                axisEnabled = userConfig.axisEnabled;
            if (userConfig.brushEnabled != null)
                brushEnabled = userConfig.brushEnabled;
            if (userConfig.valueHintEnabled != null)
                valueHintEnabled = userConfig.valueHintEnabled;
            if (userConfig.xAxisEnabled != null)
                xAxisEnabled = userConfig.xAxisEnabled;
            if (userConfig.yAxisEnabled != null)
                yAxisEnabled = userConfig.yAxisEnabled;
            if (userConfig.containerSize != null)
                containerSize = userConfig.containerSize;
            if (userConfig.xAxisOrient != null) 
                xAxisOrient = userConfig.xAxisOrient;
            if (userConfig.yAxisOrient != null) 
                yAxisOrient = userConfig.yAxisOrient;
            if (userConfig.xTicksCount != null)
                xTicksCount = userConfig.xTicksCount;
            if (userConfig.yTicksCount != null)
                yTicksCount = userConfig.yTicksCount;
            if (userConfig.xTicksFormat != null)
                xTicksFormat = userConfig.xTicksFormat;
            if (userConfig.yTicksCount != null)
                yTicksFormat = userConfig.yTicksFormat;
            if (userConfig.horizontalBandCount != null) {
                horizontalBandCount = userConfig.horizontalBandCount;
                if (horizontalBandCount > 5) {
                    console.log("VisTimeline Error: horizontalBandCount can not be large than 5");
                    horizontalBandCount = 5;
                }
            }

            computeGraphSize();
            createSVG();
        }

        TL.render = function() {
            if (data == null) {
                console.log("VisTimeline Error: The data is not set before rendering");
                return false;
            }
            processData();
            if (axisEnabled)
                renderAxis();
            gpGraph = group
                .append("g")
                .attr("class", "VTL-graph");

            // add brush           
            if (brushEnabled)
                addBrush();

            if (valueHintEnabled) {
                addValueHint();
            }            

            // render graph
            switch(graphType) {
                case "curve":
                    renderCurveGraph();
                    break;
                case "horizontalLine":
                    renderHorizontalLine();
                    break;
                case "band":
                    renderBandGraph();
                    break;
                default:
                    break;
            }
        }

        TL.resize = function() {
            computeGraphSize();
            svg
                .attr("width", graphSize.w + margin.left + margin.right)
                .attr("height", graphSize.h + margin.top + margin.bottom);
            processData();
            if (axisEnabled)
                renderAxis(true);

            // render graph
            switch(graphType) {
                case "curve":
                    renderCurveGraph(true);
                    break;
                case "horizontalLine":
                    renderHorizontalLine(true);
                    break;
                case "band":
                    renderBandGraph(true);
                    break;
                default:
                    break;
            }
        }        

        TL.setData = function(userData) {
            data = userData;
            return TL;
        }

        TL.setBrushEndCallback = function(func) {
            brushEndCallback = func;
            return TL;
        }

        TL.setBrushRange = function(x0, x1) {
            var xPos0 = Math.round(xScale(x0));
            var xPos1 = Math.round(xScale(x1));
            var h = $(container).find(".VTL-brush background")
                .attr("height");
            $(container).find(".VTL-brush .extent")
                .attr("x", xPos0)
                .attr("width", xPos1 - xPos0)
                .attr("height", h);
            $(container).find(".VTL-brush .w")
                .attr("transform","translate(" + xPos0 + ",0)");
            $(container).find(".VTL-brush .e")
                .attr("transform","translate(" + xPos1 +",0)");
            brush.extent([x0, x1]);

        }

        function createSVG() {
            svg = d3.select(container).append("svg")
                .attr("class", "VTL-SVG-wrapper");
            group = svg
                .attr("width", graphSize.w + margin.left + margin.right)
                .attr("height", graphSize.h + margin.top + margin.bottom)
                .append("g")
                .attr("class", "VTL-SVG")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        }

        function processData() {
            var tmpXMin = Number.MAX_VALUE;
            var tmpXMax = Number.MIN_VALUE;
            for (var i = 0; i < data.length; i++) {
                if (tmpXMin > data[i].x)
                    tmpXMin = data[i].x;
                if (tmpXMax < data[i].x)
                    tmpXMax = data[i].x;
            }
            xDataMax = tmpXMax;
            xDataMin = tmpXMin;
            if (xMin == null || xMax == null) {
                if (xMin == null)
                    xMin = tmpXMin;
                if (xMax == null)
                    xMax = tmpXMax;
            }

            var tmpYMin = Number.MAX_VALUE;
            var tmpYMax = Number.MIN_VALUE;
            for (var i = 0; i < data.length; i++) {
                if (tmpYMin > data[i].y)
                    tmpYMin = data[i].y;
                if (tmpYMax < data[i].y)
                    tmpYMax = data[i].y;
            }
            yDataMax = tmpYMax;
            yDataMin = tmpYMin;         
            if (yMin == null || yMax == null) {
                if (yMin == null)
                    yMin = tmpYMin;
                if (yMax == null)
                    yMax = tmpYMax;
            }            
            xScale = d3.scale.linear().domain([xMin, xMax]).range([0, graphSize.w]);
            yScale = d3.scale.linear().domain([yMin, yMax]).range([graphSize.h, 0]);
        }

        function renderAxis(isUpdate) {
            var xAxis = d3.svg.axis()
                .scale(xScale)
                .orient(xAxisOrient)
                .ticks(xTicksCount)
            if (xTicksFormat != null)
                xAxis.ticks(xTicksCount, xTicksFormat);

            var yAxis = d3.svg.axis()
                .scale(yScale)
                .orient(yAxisOrient)
                .ticks(yTicksCount)
            if (xTicksFormat != null)
                yAxis.ticks(yTicksCount, yTicksFormat);

            if (isUpdate != true) {
                if (xAxisEnabled == true) {
                    group.append("g")
                        .attr("class", "VTL-axis VTL-x-axis")
                        .attr("transform", "translate(0," + graphSize.h + ")")
                        .call(xAxis);
                }
                if (yAxisEnabled == true) {
                    group.append("g")
                        .attr("class", "VTL-axis VTL-y-axis")
                        .attr("transform", "translate(0, 0)")
                        .call(yAxis);
                }

            }
            else {
                if (xAxisEnabled == true) {
                    group.select(".VTL-x-axis")
                        .attr("transform", "translate(0," + graphSize.h + ")")
                        .call(xAxis);
                }
                if (yAxisEnabled == true) {
                    group.select(".VTL-y-axis")
                        .attr("transform", "translate(0, 0)")
                        .call(yAxis);
                }                
            }
        }



        function renderCurveGraph(isUpdate) {
            var line = d3.svg.line()
                .x(function(d) { return xScale(d.x); })
                .y(function(d) { return yScale(d.y); });

            var initArea = d3.svg.area()
                    .x(line.x())
                    .y1(yScale(yMin))
                    .y0(yScale(yMin));

            var area = d3.svg.area()
                    .x(line.x())
                    .y1(line.y())
                    .y0(yScale(yMin));                    

            if (isUpdate != true) {
                var areaElement = gpGraph.append("path")
                    .datum(data)
                    .attr("class", "VTL-area")
                    .attr("d", initArea);

                areaElement.transition()
                    .duration(duration)
                    .attr("d", area);
            } else {
                gpGraph.select(".VTL-area")
                    .attr("d", area);
            }
        }

        function renderBandGraph(isUpdate) {
            var gradientId = randomString();
            var gradient = gpGraph.append("defs")
                .append("linearGradient")
                .attr("id", "VTL-gradient-" + gradientId)
                .attr("x1", "0%")
                .attr("y1", "0%")
                .attr("x2", "100%")
                .attr("y2", "0%")
            gradient.selectAll("stop")
                .data(data).enter()
                .append("stop")
                .attr("offset", function(d) {
                    var p = map(d.x, xDataMin, xDataMax, 0, 100);
                    return p + "%";
                })
                .attr("style", function(d) {
                    var p = map(d.y, yDataMin, yDataMax, 0, 1);
                    hsl = gradientColor(p);
                    // return "stop-color:" + hsl.rgb().toString();
                    return "stop-color:rgba(107,174,214," + p + ")";
                });

            if (isUpdate != true) {
                var bandElement = gpGraph.append("rect")
                    .attr("width", graphSize.w)
                    .attr("height", 0)
                    .attr("class", "VTL-area")
                    .style("fill", "url(#VTL-gradient-" + gradientId + ")");
                bandElement.transition()
                    .duration(duration)
                    .attr("height", graphSize.h)
            } else {
                gpGraph.select(".VTL-area")
                    .attr("width", graphSize.w)
                    .attr("height", graphSize.h);
            }



        }

        function renderHorizontalLine(isUpdate) {
            if (horizontalBandCount != null) {
                tmpYScale = d3.scale.linear().domain([yMin, yMax]).range([graphSize.h * horizontalBandCount, 0]);
            }
            var line = d3.svg.line()
                .x(function(d) { return xScale(d.x); })
                .y(function(d) { return tmpYScale(d.y); })

            var initArea = d3.svg.area()
                    .x(line.x())
                    .y1(tmpYScale(yMin))
                    .y0(tmpYScale(yMin));
            var area = d3.svg.area()
                    .x(line.x())
                    .y1(line.y())
                    .y0(tmpYScale(yMin));

            if (isUpdate != true) {
                for (var i = 0; i < horizontalBandCount; i++) {
                    var transY = graphSize.h * (horizontalBandCount - i - 1)
                    var clipId = randomString();
                    gpGraph.append("clipPath")
                        .attr("class", "VTL-clip-area")
                        .attr("id", "VTL-clip-" + clipId)
                        .append("rect")
                        .attr("width", graphSize.w)
                        .attr("height", graphSize.h)
                        .attr("x", 0)
                        .attr("y", 0)
                        .attr("transform", "translate(0, " + transY + ")");
                    var areaElement = gpGraph.append("path")
                        .datum(data)
                        .attr("class", "VTL-hzt-area VTL-hzt-area-" + i)
                        .attr("d", initArea)
                        .attr("transform", "translate(0, -" + transY + ")")
                        .attr("clip-path", "url(#VTL-clip-" + clipId + ")")

                    areaElement.transition()
                        .duration(duration)
                        .attr("d", area);
                }
            } else {
                //#注意调节高度
                gpGraph.selectAll(".VTL-clip-area rect")
                    .attr("width", graphSize.w)
                    .attr("height", graphSize.h);
                gpGraph.selectAll(".VTL-hzt-area")
                    .attr("d", area);
            }



        }        

        function addBrush() {
            brush = d3.svg.brush()
                .x(xScale)
                .on("brushend", funcBrushEnd);
            gpBrush = group.append("g")
                .attr("class", "VTL-brush")
                .call(brush);
            gpBrush.selectAll("rect")
                .attr("height", graphSize.h);
            // gBrush.selectAll(".resize").append("path")
            //     .attr("transform", "translate(0," +  graphSize.h / 2 + ")")
            //     .attr("d", arc);  

            function funcBrushEnd(x0, x1) {
                extent = brush.extent();
                console.log("brushend:" +  " " + extent);
                if (brushEndCallback != null)
                    brushEndCallback(extent[0], extent[1]);
            }
        }

        function addValueHint() {
            gpHint = group.append("g")
                .attr("class", "VTL-hint")
                // .style("display", "none");
            gpHint.append("text")
                .attr("x", 9)
                .attr("dy", ".35em");
            gpHint.append("rect")
                .attr("class", "VTL-hint-overlay")
                .attr("width", graphSize.w)
                .attr("height", graphSize.h)
                .attr("x", 0)
                .attr("y", 0)
                .attr("fill", "transparent")
                // .on("mouseover", function() { gpHint.style("display", null); })
                // .on("mouseout", function() { gpHint.style("display", "none"); })
                .style("pointer-events", "none")
                .on("mousemove", valueHintMouseMove);
        }

        function valueHintMouseMove() {
            var x0 = xScale.invert(d3.mouse(this)[0]);
            console.log("mousemove:" + x0);
            // i = bisectDate(data, x0, 1),
            // d0 = data[i - 1],
            // d1 = data[i],
            // d = x0 - d0.date > d1.date - x0 ? d1 : d0;
            // focus.attr("transform", "translate(" + x(d.date) + "," + y(d.close) + ")");
            // focus.select("text").text(formatCurrency(d.close));
        }        

        function computeGraphSize() {
            var width = $(container).width() - margin.left - margin.right,
                height = $(container).height() - margin.top - margin.bottom;
            graphSize = {w:width, h:height, 
                cw:$(container).width(), ch:$(container).height() };
        }

        return TL;
    }


    function map(value, min, max, toMin, toMax){
        var v = (value - min) / (max - min) * (toMax - toMin) + toMin;
        return v;
    }

    function simpleMap(value, max, toMax){
        if (max < 0.00001)
            return 0;
        
        if (value < 0)
            value = 0;
        if (value > max)
            value = max;

        return v = value / max * toMax;
    }
    
    function sqrt(value){
        return Math.sqrt(value);
    }

    function randomString(len) {
        if (len == null || len < 16)
            len = 16;
        var chars = 'abcdefghijklmnopqrstuvwxyz0123456788';
        var maxPos = chars.length;
        var str = '';
        for (i = 0; i < len; i++) {
            str += chars.charAt(Math.floor(Math.random() * maxPos));
        }
        return str;
    }

    window['VTL'] = VTL;
})();