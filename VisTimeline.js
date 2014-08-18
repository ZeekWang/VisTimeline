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
        var xMin, xMax, yMin, yMax;
        var xScale, yScale;
        var hasAxis, hasBrush;
        var svg, group, gpGraph, gpBrush;
        var data;
        var brushEndCallback;

        init(userConfig);

        function init(userConfig) {
            container = null;
            hasAxis = true;
            hasBrush = false;
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
                margin = config.margin = userConfig.margin;
            if (userConfig.xMin != null)
                xMin = config.xMin = userConfig.xMin;
            if (userConfig.xMax != null)
                xMax = config.xMax = userConfig.xMax;
            if (userConfig.yMin != null)
                yMin = config.yMin = userConfig.yMin;
            if (userConfig.yMax != null)
                yMax = config.yMax = userConfig.yMax;
            if (userConfig.hasAxis != null)
                hasAxis = config.hasAxis = userConfig.hasAxis;
            if (userConfig.hasBrush != null)
                hasBrush = config.hasBrush = userConfig.hasBrush;
            if (userConfig.containerSize != null)
                containerSize = config.containerSize = userConfig.containerSize;
            if (userConfig.xAxisOrient != null) 
                xAxisOrient = config.xAxisOrient = userConfig.xAxisOrient;
            if (userConfig.yAxisOrient != null) 
                yAxisOrient = config.yAxisOrient = userConfig.yAxisOrient;

            computeGraphSize();
            createSVG();
        }

        TL.render = function() {
            if (data == null) {
                console.log("VisTimeline Error: The data is not set before rendering");
                return false;
            }
            computeData();
            if (hasAxis)
                renderAxis();
            gpGraph = group.append("g")
                .attr("class", "VTL-graph");              
            if (hasBrush)
                addBrush();

            switch(graphType) {
                case "curve":
                    renderCurveGraph();
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

        function createSVG() {
            svg = d3.select(container).append("svg");
            group = svg
                .attr("width", graphSize.w + margin.left + margin.right)
                .attr("height", graphSize.h + margin.top + margin.bottom)
                .append("g")
                .attr("class", "VTL-SVG")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        }

        function computeData() {
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

            group.append("g")
                .attr("class", "x axis VTL-axis")
                .attr("transform", "translate(0," + graphSize.h + ")")
                .call(xAxis);
            group.append("g")
                .attr("class", "y axis VTL-axis")
                .attr("transform", "translate(0, 0)")
                .call(yAxis);
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
                .attr("class", "line")
                .attr("d", area);
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


        function computeGraphSize() {
            var width = $(container).width() - margin.left - margin.right,
                height = $(container).height() - margin.top - margin.bottom;
            graphSize = {w:width, h:height};
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

    window['VTL'] = VTL;
})();