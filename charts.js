function Chart(element, info) {
  this.element = element;
}

Chart.prototype.generateFunction = function(f, range) {
  var theList = [];
  if(range instanceof Object && range.hasOwnProperty("to") && range.hasOwnProperty("from") && range.hasOwnProperty("step")) {
    for(var i=range.from; i <= range.to; i += range.step) {
      theList.push(f(i));
    }
  } else if(range instanceof Array) {
    for(var i=0; i<range.length; i++) {
      theList.push(f(range[i]));
    }
  }
  return theList;
};

Chart.prototype.setSVGDim = function(element) {
  this.svgHeight = parseInt(element.style("height"));
  this.svgWidth = parseInt(element.style("width"));
};

Chart.prototype.calcColors = function(info) {
  if(!info.hasOwnProperty("colors")) {
    this.colors = ["black"];
  } else if(info.colors instanceof Array) {
    this.colors = info.colors;
  } else if(info.colors instanceof Function) {
    this.colors = generateFunction(info.colors, 0, this.x.length-1, 1);
  }
};

Chart.prototype.getColor = function(n) {
  return this.colors[n % this.colors.length];
};

function RectangularChart(element, info) {
  this.element = element;
}

RectangularChart.prototype = new Chart();

RectangularChart.prototype.functionEach = function(d, f) {
  if(d[0] instanceof Array) {
    var each = [];
    for(var i=0; i<d.length; i++) {
      each.push(f(...d[i]));
    }
    return f(...each);
  } else {
    return f(...d);
  }
};

RectangularChart.prototype.getMax = function(d) {
  return this.functionEach(d, Math.max);
};

RectangularChart.prototype.getMin = function(d) {
  return this.functionEach(d, Math.min);
};

RectangularChart.prototype.setAxisData = function(info) {
  if(info.hasOwnProperty("xAxisPadding")) {
    this.xAxisPadding = info.xAxisPadding;
  } else {
    this.xAxisPadding = 0;
  }
  if(info.hasOwnProperty("yAxisPadding")) {
    this.yAxisPadding = info.yAxisPadding;
  } else {
    this.yAxisPadding = 0;
  }
  if(info.hasOwnProperty("xEdgePadding")) {
    this.xEdge = info.xEdgePadding;
  } else {
    this.xEdge = 0;
  }
  if(info.hasOwnProperty("yEdgePadding")){
    this.yEdge = info.yEdgePadding;
  } else {
    this.yEdge = 0;
  }
};

RectangularChart.prototype.setScale = function(info) {
  if(info.hasOwnProperty("yScale")) {
    this.yScale = info.yScale;
  } else {
    var yMax = this.getMax(this.y);
    this.yScale = (this.yOrigin-this.yEdge)/yMax;
  }
};

RectangularChart.prototype.setAxisIncrement = function(info) {
  if(info.hasOwnProperty("yIncrement")) {
    this.yIncrement = info.yIncrement;
  } else {
    var nIncrements = 10;
    if(info.hasOwnProperty("numberOfIncrements")) {
      nIncrements = info.numberOfIncrements;
    }
    this.yIncrement = this.getMax(this.y)/nIncrements;
  }
};

RectangularChart.prototype.calcOrigin = function(info) {
  this.xOrigin = this.yAxisPadding;
  this.yOrigin = this.svgHeight - this.xAxisPadding;
};

RectangularChart.prototype.calcXData = function(x, range) {
  if(x instanceof Array) {
    return x;
  } else if(x instanceof Function) {
    return this.generateFunction(x, {from:range[0], to:range[1], step:range[2]});
  }
};

RectangularChart.prototype.calcYData = function(y, x) {
  if(y instanceof Array) {
    return y;
  } else if(y instanceof Function) {
    return this.generateFunction(y, x);
  }
};

RectangularChart.prototype.getXAxisLabels = function() {
  return this.x;
}

RectangularChart.prototype.getYAxisLabels = function() {
  var i=0;
  var axisLabelsList = [];
  while(i*this.yIncrement*this.yScale <= this.yOrigin) {
    axisLabelsList.push(i*this.yIncrement);
    i++;
  }
  return axisLabelsList;
};

RectangularChart.prototype.getXAxisLabelTranslate = function(d, i) {
  return this.getXTranslate(i);
};

RectangularChart.prototype.renderXAxisLabels = function() {
  var chart = this;
  var labels = this.getXAxisLabels();
  this.element.append("g")
    .attr("id", "#xAxisLabels")
    .selectAll("text")
    .data(labels)
    .enter()
    .append("text")
    .attr("x", function(d,i) {return chart.getXAxisLabelTranslate(d,i)})
    .attr("y", chart.svgHeight)
    .attr("fill", "black")
    .text(function(d,i) {return d;});
};

RectangularChart.prototype.renderAxes = function() {
  var chart = this;
  chart.element.append("line")
    .attr("x1", chart.xOrigin)
    .attr("y1", chart.yOrigin)
    .attr("x2", chart.svgWidth)
    .attr("y2", chart.yOrigin)
    .style("stroke", "black")
    .style("stroke-width", 1);
  chart.element.append("line")
    .attr("x1", chart.xOrigin)
    .attr("y1", chart.yOrigin)
    .attr("x2", chart.xOrigin)
    .attr("y2", 0)
    .style("stroke", "black")
    .style("stroke-width", 1);
  chart.renderXAxisLabels();
  var yAxisLabels = chart.getYAxisLabels();
  chart.element.append("g")
    .attr("id", "#yAxisLabels")
    .selectAll("text")
    .data(yAxisLabels)
    .enter()
    .append("text")
    .attr("x", 0)
    .attr("y", function(d,i) {return chart.yOrigin-i*(chart.yIncrement*chart.yScale);})
    .attr("fill", "black")
    .text(function(d,i) {return d;});
};

function BarChart(element, info) {
  this.element = element;
  this.setSVGDim(element);
  this.setBarDimensions(info);
  this.setAxisData(info);
  this.calcOrigin(info);
  this.setData(info);
  this.setScale(info);
  this.setAxisIncrement(info);
  this.calcColors(info);
  this.render();
  this.renderAxes();
};

BarChart.prototype = new RectangularChart();
BarChart.prototype.data = {};
BarChart.prototype.constructor = BarChart;

BarChart.prototype.setData = function(info) {
  this.x = this.calcXData(info.x, info.range);
  this.y = this.calcYData(info.y, this.x);
}

BarChart.prototype.setBarDimensions = function(info) {
    if(info.hasOwnProperty("barWidth")) {
      this.barWidth = info.barWidth;
    } else {
      this.barWidth = 15;
    }
    if(info.hasOwnProperty("barSpace")) {
      this.barSpace = info.barSpace;
    } else {
      this.barSpace = 5;
    }
  };

BarChart.prototype.getBarHeight = function(d) {
    return this.yScale*d;
  };

BarChart.prototype.getXTranslate = function(i) {
    return this.xOrigin + i*(this.barWidth+this.barSpace);
  };

BarChart.prototype.getYTranslate = function(i,d) {
    return this.yOrigin-this.getBarHeight(d);
  };

BarChart.prototype.render = function() {
  console.log(this);
  var element = this.element
  var chart = this;
  element.selectAll("rect")
    .data(chart.y)
    .enter()
    .append("rect")
    .attr("width", chart.barWidth)
    .attr("height", function(d,i) {return chart.getBarHeight(d);})
    .attr("transform", function(d,i) {return "translate("+(chart.getXTranslate(i))+","+(chart.getYTranslate(i,d))+")";})
    .attr("fill", function(d,i) {return chart.getColor(i);});
};

function PieChart(element, info) {
  this.element = element;
  this.data = info.data;
  if(info.hasOwnProperty("names")) {
    this.names = info.names;
  } else {
    this.names = null;
  }
  this.setSVGDim(element);
  this.setRadius();
  this.setCenter();
  this.setTotal();
  this.calcColors(info);
  this.setChartAngles();
  this.renderSlices();
  this.renderLabels();
}

PieChart.prototype = new Chart();

PieChart.prototype.setRadius = function() {
    this.radius = Math.round(Math.min(this.svgHeight, this.svgWidth)/2)
  };

PieChart.prototype.setCenter = function() {
    this.xPieCenter = Math.round(this.svgWidth/2);
    this.yPieCenter = Math.round(this.svgHeight/2);
  };

PieChart.prototype.setTotal = function() {
    this.total = 0;
    for(var i=0; i<this.data.length; i++) {
      this.total += this.data[i];
    }
  };

PieChart.prototype.calcColors = function(info) {
    if(!info.hasOwnProperty("colors")) {
      this.colors = ["black"];
    } else if(info.colors instanceof Array) {
      this.colors = info.colors;
    } else if(info.colors instanceof Function) {
      this.colors = generateFunction(info.colors, 0, this.x.length-1, 1);
    }
};

PieChart.prototype.getColor = function(n) {
    return this.colors[n % this.colors.length];
  };

PieChart.prototype.setChartAngles = function() {
    this.chartAngles = [0];
    var currentAngle = 0;
    for(var i=0; i<this.data.length; i++) {
      var sliceAngle = 2*Math.PI*this.data[i]/this.total;
      this.chartAngles.push(currentAngle + sliceAngle);
      currentAngle += sliceAngle;
    }
  };

PieChart.prototype.getSweep = function(idx) {
  if(this.chartAngles[idx+1] - this.chartAngles[idx] <= Math.PI) {
    return "0 1";
  } else {
    return "1 1";
  }
};

PieChart.prototype.getPath = function(idx) {
    var x1 = Math.round(this.radius*Math.cos(this.chartAngles[idx]) + this.xPieCenter);
    var y1 = Math.round(this.radius*Math.sin(this.chartAngles[idx]) + this.yPieCenter);
    var x2 = Math.round(this.radius*Math.cos(this.chartAngles[idx+1]) + this.xPieCenter);
    var y2 = Math.round(this.radius*Math.sin(this.chartAngles[idx+1]) + this.yPieCenter);
    return "M " + x1 + " " + y1 + " A " + this.radius + " " + this.radius + " 0 " + this.getSweep(idx) + " " + x2 + " " + y2 + " L " + this.xPieCenter + " " + this.yPieCenter + " Z";
  };

PieChart.prototype.getTextXCo = function(idx) {
    var angle = (this.chartAngles[idx] + this.chartAngles[idx+1])/2;
    return Math.round(0.5*this.radius*Math.cos(angle) + this.xPieCenter);
  };

PieChart.prototype.getTextYCo = function(idx) {
    var angle = (this.chartAngles[idx] + this.chartAngles[idx+1])/2;
    return Math.round(0.5*this.radius*Math.sin(angle) + this.yPieCenter);
  };

PieChart.prototype.getTextRotate = function(idx) {
    var angle = (this.chartAngles[idx] + this.chartAngles[idx+1])/2;
    if(Math.PI/2 < angle && angle < 3*Math.PI/2) {
      angle -= Math.PI
    }
    return Math.round(180*angle/Math.PI) + " " + this.getTextXCo(idx) + "," + this.getTextYCo(idx);
  };

PieChart.prototype.getSliceLabel = function(idx) {
    var s = Math.round(100*this.data[idx]/this.total, 1) + "%";
    if(this.names !== null) {
      s += " " + this.names[idx];
    }
    return s;
  };

PieChart.prototype.renderSlices = function() {
    var element = this.element;
    var chart = this;
    element.selectAll("path")
      .data(chart.data)
      .enter()
      .append("path")
      .attr("d", function(d,i) {return chart.getPath(i);})
      .attr("fill", function(d,i) {return chart.getColor(i);});
  };

PieChart.prototype.renderLabels = function() {
    var element = this.element;
    var chart = this;
    element.selectAll("text")
      .data(chart.data)
      .enter()
      .append("text")
      .attr("x", function(d,i) {return chart.getTextXCo(i);})
      .attr("y", function(d,i) {return chart.getTextYCo(i);})
      .attr("fill", "white")
      .attr("transform", function(d,i) {return "rotate(" + chart.getTextRotate(i) + ")";})
      .text(function(d,i) {return chart.getSliceLabel(i);})
  };

function LineChart(element, info) {
  this.element = element;
  this.setSVGDim(element);
  this.setAxisData(info);
  this.calcOrigin(info);
  this.setData(info);
  this.setScale(info);
  this.setXScale(info);
  this.setAxisIncrement(info);
  this.setXAxisLabels(info);
  this.calcColors(info);
  this.renderAll();
  this.renderAxes();
};

LineChart.prototype = new RectangularChart();

LineChart.prototype.setData = function(info) {
  if(!(info.x instanceof Array) || (info.x[0] instanceof Number)) {
    info.x = [info.x];
  }
  if(!(info.y instanceof Array) || (info.y[0] instanceof Number)) {
    info.y = [info.y];
  }
  if(!(info.range[0] instanceof Array)) {
    info.range = [info.range];
  }
  this.x = [];
  this.y = [];
  for(var i=0; i < Math.max(info.x.length, info.range.length); i++) {
    this.x.push(this.calcXData(info.x[i%info.x.length], info.range[i%info.range.length]));
  }
  for(var i=0; i < Math.max(info.y.length, this.x.length); i++) {
    this.y.push(this.calcYData(info.y[i%info.y.length], this.x[i%this.x.length]));
  }
};

LineChart.prototype.getXByIndex = function(idx) {
  return Math.round(this.xWidth*idx + this.xOrigin);
};

LineChart.prototype.getXByData = function(d) {
  console.log("A", d, Math.round(this.xScale*d + this.xOrigin));
  return Math.round(this.xScale*(d-this.xMin) + this.xOrigin);
};

LineChart.prototype.getX = function(idx, d) {
  if(this.hasOwnProperty("xScale")) {
    return this.getXByData(d);
  } else if(this.hasOwnProperty("xWidth")) {
    return this.getXByIndex(idx);
  }
}

LineChart.prototype.getXTranslate = function(number, idx) {
  var d = this.x[number%this.x.length][idx];
  return this.getX(idx, d);
};

LineChart.prototype.getYTranslate = function(number, idx) {
  var d = this.y[number%this.y.length][idx];
  return Math.round(this.yOrigin - this.yScale*d);
};

LineChart.prototype.getXAxisLabelTranslate = function(d, i) {
  return this.getX(i, d);
}

LineChart.prototype.setXScale = function(info) {
  if(info.hasOwnProperty("xScale")) {
    this.xScale = info.xScale;
  } else if(info.hasOwnProperty("xWidth")) {
    this.xWidth = info.xWidth;
  } else {
    var xMax = this.getMax(this.x);
    var xMin = this.getMin(this.x);
    this.xMin = xMin;
    this.xScale = (this.svgWidth-this.xOrigin-this.xEdge)/(xMax-xMin);
    console.log("xScale", this.svgWidth, this.xOrigin, xMin, xMax, this.xScale)
  }
};

LineChart.prototype.getAllX = function() {
  var xValues = [];
  for(var i=0; i<this.x.length; i++) {
    for(var j=0; j<this.x[i].length; j++) {
      if(!xValues.includes(this.x[i][j])) {
        xValues.push(this.x[i][j])
      }
    }
  }
  console.log("xvalues", xValues)
  return xValues;
}

LineChart.prototype.getXAxisLabels = function() {
  return this.xAxisLabels;
}

LineChart.prototype.setXAxisLabels = function(info) {
  if(!info.hasOwnProperty("xScale") && info.hasOwnProperty("xWidth")) {
    this.xAxisLabels = this.getAllX();
  } else if(info.hasOwnProperty("xIncrement")) {
    this.xAxisLabels = this.generateFunction(function(i) {return i;}, [this.getMin(this.x), this.getMax(this.x), info.xIncrement]);
  } else if(info.hasOwnProperty("numberOfIncrements")) {
    var nIncrements = info.numberOfIncrements;
    this.xIncrement = this.getMax(this.x)/nIncrements;
  } else {
    this.xAxisLabels = this.getAllX();
  }
}

LineChart.prototype.getRenderPointsData = function(number) {
  var data = [];
  for(var i=0; i<this.y[number].length; i++) {
    data.push([this.getXTranslate(number, i), this.getYTranslate(number, i), this.getColor(number)]);
  }
  return data;
}

LineChart.prototype.getRenderSegmentsData = function(number) {
  var data = [];
  for(var i=0; i<this.y[number].length-1; i++) {
    data.push([this.getXTranslate(number, i), this.getYTranslate(number, i), this.getXTranslate(number, i+1), this.getYTranslate(number, i+1), this.getColor(number)]);
  }
  return data;
}

LineChart.prototype.render = function(number) {
  console.log(this);
  var element = this.element;
  var chart = this;
  var g = "g" + number;
  element.append("g")
    .attr("id",g);
  element.select("#"+g)
    .selectAll("circle")
    .data(chart.getRenderPointsData(number))
    .enter()
    .append("circle")
    .attr("r", 5)
    .attr("cx", function(d,i) {return d[0];})
    .attr("cy", function(d,i) {return d[1];})
    .attr("fill", function(d,i) {return d[2];});
  element.select("#"+g)
    .selectAll("line")
    .data(chart.getRenderSegmentsData(number))
    .enter()
    .append("line")
    .attr("x1", function(d,i) {return d[0];})
    .attr("y1", function(d,i) {return d[1];})
    .attr("x2", function(d,i) {return d[2];})
    .attr("y2", function(d,i) {return d[3];})
    .attr("stroke-width", 2)
    .attr("stroke", function(d,i) {return d[4];});
}

LineChart.prototype.renderAll = function() {
  for(var i=0; i<this.y.length; i++) {
    this.render(i);
  }
}
