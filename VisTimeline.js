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
        var config, container, margin, 
            containerSize, containerSize, graphSize, 
            graphType;
        var xAxisOrient, yAxisOrient;
        var xMin = null, xMax = null, yMin = null, yMax = null;
        var xScale, yScale;
        var axisEnabled, brushEnabled, valueHintEnabled;
        var xAxisEnabled, yAxisEnabled;
        var svg, group, gpGraph, gpBrush, gpHint;
        var data;
        var brushEndCallback;
        var horizontalBandCount, horizontalHeight;

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

            // render graph
            switch(graphType) {
                case "curve":
                    renderCurveGraph();
                    break;
                case "horizontalLine":
                    renderHorizontalLine();
                    break;
            }

            // 
            if (valueHintEnabled) {
                addValueHint();
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

        function createSVG() {
            svg = d3.select(container).append("svg");
            group = svg
                .attr("width", graphSize.w + margin.left + margin.right)
                .attr("height", graphSize.h + margin.top + margin.bottom)
                .append("g")
                .attr("class", "VTL-SVG")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        }

        function processData() {
            if (xMin == null || xMax == null) {
                tmpXMin = Number.MAX_VALUE;
                tmpXMax = Number.MIN_VALUE;
                for (var i = 0; i < data.length; i++) {
                    if (tmpXMin > data[i].x)
                        tmpXMin = data[i].x;
                    if (tmpXMax < data[i].x)
                        tmpXMax = data[i].x;
                }
                if (xMin == null)
                    xMin = tmpXMin;
                if (xMax == null)
                    xMax = tmpXMax;
            }
            if (yMin == null || yMax == null) {
                tmpYMin = Number.MAX_VALUE;
                tmpYMax = Number.MIN_VALUE;
                for (var i = 0; i < data.length; i++) {
                    if (tmpYMin > data[i].y)
                        tmpYMin = data[i].y;
                    if (tmpYMax < data[i].y)
                        tmpYMax = data[i].y;
                }
                if (yMin == null)
                    yMin = tmpYMin;
                if (yMax == null)
                    yMax = tmpYMax;
            }            
            xScale = d3.scale.linear().domain([xMin, xMax]).range([0, graphSize.w]);
            yScale = d3.scale.linear().domain([yMin, yMax]).range([graphSize.h, 0]);            

        }

        function renderAxis() {
            var xAxis = d3.svg.axis()
                .scale(xScale)
                .orient(xAxisOrient)
            var yAxis = d3.svg.axis()
                .scale(yScale)
                .orient(yAxisOrient)

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

        function renderCurveGraph() {
            var line = d3.svg.line()
                .x(function(d) { return xScale(d.x); })
                .y(function(d) { return yScale(d.y); });

            var area = d3.svg.area()
                    .x(line.x())
                    .y1(line.y())
                    .y0(yScale(yMin));

            gpGraph.append("path")
                .datum(data)
                .attr("class", "VTL-area")
                .attr("d", area);
        }

        function renderHorizontalLine() {
            if (horizontalBandCount != null) {
                tmpYScale = d3.scale.linear().domain([yMin, yMax]).range([graphSize.h * horizontalBandCount, 0]);
            }
            var line = d3.svg.line()
                .x(function(d) { return xScale(d.x); })
                .y(function(d) { return tmpYScale(d.y); })
            var area = d3.svg.area()
                    .x(line.x())
                    .y1(line.y())
                    .y0(tmpYScale(yMin));
            for (var i = 0; i < horizontalBandCount; i++) {
                var transY = graphSize.h * (horizontalBandCount - i - 1)
                var clipId = randomString();
                gpGraph.append("clipPath")
                    .attr("id", "VTL-clip-" + clipId)
                    .append("rect")
                    .attr("width", graphSize.w)
                    .attr("height", graphSize.h)
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("transform", "translate(0, " + transY + ")");
                gpGraph.append("path")
                    .datum(data)
                    .attr("class", "VTL-hzt-area-" + i)
                    .attr("d", area)
                    .attr("transform", "translate(0, -" + transY + ")")
                    .attr("clip-path", "url(#VTL-clip-" + clipId + ")")
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
                if (brushEndCallback != null)
                    brushEndCallback(extent[0], extent[1]);
            }
        }

        function addValueHint() {
            gpHint = svg.append("g")
                .attr("class", "VTL-hint")
                .style("display", "none");
            gpHint.append("text")
                .attr("x", 9)
                .attr("dy", ".35em");
            gpHint.append("rect")
                .attr("class", "VTL-hint-overlay")
                .attr("width", graphSize.w)
                .attr("height", graphSize.h)
                .attr("x", 0)
                .attr("y", 0)
                // .on("mouseover", function() { gpHint.style("display", null); })
                // .on("mouseout", function() { gpHint.style("display", "none"); })
                .on("mousemove", mousemove);

            function mousemove() {
                var x0 = xScale.invert(d3.mouse(this)[0]);
                // i = bisectDate(data, x0, 1),
                // d0 = data[i - 1],
                // d1 = data[i],
                // d = x0 - d0.date > d1.date - x0 ? d1 : d0;
                // focus.attr("transform", "translate(" + x(d.date) + "," + y(d.close) + ")");
                // focus.select("text").text(formatCurrency(d.close));
            }
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