function createPieChart(data, selector) {
   const width = 450, height = 450, margin = 40;
   const radius = Math.min(width, height) / 2 - margin;

   const svg = d3.select(selector)
       .append("svg")
       .attr("width", width)
       .attr("height", height)
       .append("g")
       .attr("transform", `translate(${width / 2},${height / 2})`);

   const color = d3.scaleOrdinal()
       .domain(data.map(d => d.sentiment))
       .range(d3.schemeCategory10);

   const pie = d3.pie()
       .value(d => d.count);

   const data_ready = pie(data);

   const arc = d3.arc()
       .innerRadius(0)
       .outerRadius(radius);

   const arcHover = d3.arc()
       .innerRadius(0)
       .outerRadius(radius + 10);

   const tooltip = d3.select("body")
       .append("div")
       .attr("class", "tooltip")
       .style("position", "absolute")
       .style("background", "#f4f4f4")
       .style("padding", "5px 10px")
       .style("border", "1px solid #d4d4d4")
       .style("border-radius", "5px")
       .style("pointer-events", "none")
       .style("opacity", 0);

   svg.selectAll('slices')
       .data(data_ready)
       .enter()
       .append('path')
       .attr('d', arc)
       .attr('fill', d => color(d.data.sentiment))
       .attr("stroke", "black")
       .style("stroke-width", "2px")
       .style("opacity", 0.7)
       .on("mouseover", function(event, d) {
           d3.select(this).transition()
               .duration(200)
               .attr("d", arcHover);
           tooltip.transition()
               .duration(200)
               .style("opacity", 1);
           tooltip.html(`Sentiment: ${d.data.sentiment}<br>Count: ${d.data.count}`)
               .style("left", (event.pageX + 5) + "px")
               .style("top", (event.pageY + 5) + "px");
       })
       .on("mousemove", function(event) {
           tooltip.style("left", (event.pageX + 5) + "px")
               .style("top", (event.pageY + 5) + "px");
       })
       .on("mouseout", function(d) {
           d3.select(this).transition()
               .duration(200)
               .attr("d", arc);
           tooltip.transition()
               .duration(500)
               .style("opacity", 0);
       });

   svg.selectAll('slices')
       .data(data_ready)
       .enter()
       .append('text')
       .text(d => d.data.sentiment)
       .attr("transform", d => `translate(${arc.centroid(d)})`)
       .style("text-anchor", "middle")
       .style("font-size", 17)
       .on("mouseover", function(event, d) {
           tooltip.transition()
               .duration(200)
               .style("opacity", 1);
           tooltip.html(`Sentiment: ${d.data.sentiment}<br>Count: ${d.data.count}`)
               .style("left", (event.pageX + 5) + "px")
               .style("top", (event.pageY + 5) + "px");
       })
       .on("mousemove", function(event) {
           tooltip.style("left", (event.pageX + 5) + "px")
               .style("top", (event.pageY + 5) + "px");
       })
       .on("mouseout", function(d) {
           tooltip.transition()
               .duration(500)
               .style("opacity", 0);
       });
}

function createBarChart(data, selector) {
   const margin = { top: 20, right: 30, bottom: 40, left: 90 },
       width = 460 - margin.left - margin.right,
       height = 400 - margin.top - margin.bottom;

   const svg = d3.select(selector)
       .append("svg")
       .attr("width", width + margin.left + margin.right)
       .attr("height", height + margin.top + margin.bottom)
       .append("g")
       .attr("transform", `translate(${margin.left},${margin.top})`);

   const x = d3.scaleLinear()
       .domain([0, d3.max(data, d => d.count)])
       .range([0, width]);

   svg.append("g")
       .attr("transform", `translate(0,${height})`)
       .call(d3.axisBottom(x))
       .selectAll("text")
       .attr("transform", "translate(-10,0)rotate(-45)")
       .style("text-anchor", "end");

   const y = d3.scaleBand()
       .range([0, height])
       .domain(data.map(d => d.sentiment))
       .padding(.1);

   svg.append("g")
       .call(d3.axisLeft(y));

   const tooltip = d3.select("body")
       .append("div")
       .attr("class", "tooltip")
       .style("position", "absolute")
       .style("background", "#f4f4f4")
       .style("padding", "5px 10px")
       .style("border", "1px solid #d4d4d4")
       .style("border-radius", "5px")
       .style("pointer-events", "none")
       .style("opacity", 0);

   svg.selectAll("myRect")
       .data(data)
       .enter()
       .append("rect")
       .attr("x", x(0))
       .attr("y", d => y(d.sentiment))
       .attr("width", d => x(d.count))
       .attr("height", y.bandwidth())
       .attr("fill", "#69b3a2")
       .on("mouseover", function(event, d) {
           tooltip.transition()
               .duration(200)
               .style("opacity", 1);
           tooltip.html(`Sentiment: ${d.sentiment}<br>Count: ${d.count}`)
               .style("left", (event.pageX + 5) + "px")
               .style("top", (event.pageY + 5) + "px");
       })
       .on("mousemove", function(event) {
           tooltip.style("left", (event.pageX + 5) + "px")
               .style("top", (event.pageY + 5) + "px");
       })
       .on("mouseout", function(d) {
           tooltip.transition()
               .duration(500)
               .style("opacity", 0);
       });
}

document.addEventListener('DOMContentLoaded', function () {
   const videoId = document.getElementById('video-id').value;
   if (videoId) {
       fetch(`/sentiment-distribution?video_id=${videoId}`)
           .then(response => response.json())
           .then(data => {
               createPieChart(data, '#pie-chart');
               createBarChart(data, '#bar-chart');
           })
           .catch(error => console.error('Error fetching sentiment distribution:', error));
   }
});
function createHorizontalBarChart(data, selector) {
    d3.select(selector).html(""); // Clear previous chart

    var margin = { top: 20, right: 30, bottom: 40, left: 90 },
        width = 600 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    var svg = d3.select(selector)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleLinear()
        .range([0, width])
        .domain([0, d3.max(data, function (d) { return d.frequency; })]);

    var y = d3.scaleBand()
        .range([height, 0])
        .domain(data.map(function (d) { return d.word; }))
        .padding(0.1);

    svg.append("g")
        .call(d3.axisLeft(y));

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).ticks(5));

    svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("width", function (d) { return x(d.frequency); })
        .attr("y", function (d) { return y(d.word); })
        .attr("height", y.bandwidth())
        .attr("fill", "#69b3a2");
}
function fetchTopWords(videoId, sentimentLabel) {
    d3.json(`/top-words?video_id=${videoId}&sentiment_label=${sentimentLabel}`).then(data => {
        createHorizontalBarChart(data, "#top-words-chart");
    });
}

function fetchWordCloud(videoId, sentimentLabel) {
    d3.json(`/wordcloud?video_id=${videoId}&sentiment_label=${sentimentLabel}`).then(data => {
        if (data.error) {
            console.error(data.error);
        } else {
            d3.select("#wordcloud-img").attr("src", "data:image/png;base64," + data.image);
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    const videoId = document.getElementById('video-id').value;

    if (videoId) {
        fetch(`/sentiment-distribution?video_id=${videoId}`)
            .then(response => response.json())
            .then(data => {
                createPieChart(data, '#pie-chart');
                createBarChart(data, '#bar-chart');
            })
            .catch(error => console.error('Error fetching sentiment distribution:', error));
    }

    const topCommentsSentiment = document.getElementById('top-comments-sentiment');
    topCommentsSentiment.addEventListener('change', function () {
        fetchTopComments(videoId, topCommentsSentiment.value);
    });

    fetchTopComments(videoId, topCommentsSentiment.value);
});

function fetchTopComments(videoId, sentimentLabel) {
    fetch(`/top-comments?video_id=${videoId}&sentiment_label=${sentimentLabel}`)
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('top-comments-container');
            container.innerHTML = '';
            data.forEach(comment => {
                const commentElement = document.createElement('div');
                commentElement.classList.add('social-comment');
                commentElement.innerHTML = `
                    <div class="comment-author">
                        <img src="${comment.author_profile_image_url}" alt="Profile" width="50">
                        <span>${comment.author}</span>
                    </div>
                    <div class="comment-text">
                        ${comment.text}
                    </div>
                    <div class="comment-likes">
                        Likes: ${comment.like_count}
                    </div>
                `;
                container.appendChild(commentElement);
            });
        })
        .catch(error => console.error('Error fetching top comments:', error));
}


function createHorizontalBarChart(data, selector) {
    d3.select(selector).html(""); // Clear previous chart

    var margin = { top: 20, right: 30, bottom: 40, left: 90 },
        width = 600 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    var svg = d3.select(selector)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleLinear()
        .range([0, width])
        .domain([0, d3.max(data, function (d) { return d.frequency; })]);

    var y = d3.scaleBand()
        .range([height, 0])
        .domain(data.map(function (d) { return d.word; }))
        .padding(0.1);

    svg.append("g")
        .call(d3.axisLeft(y));

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).ticks(5));

    svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("width", function (d) { return x(d.frequency); })
        .attr("y", function (d) { return y(d.word); })
        .attr("height", y.bandwidth())
        .attr("fill", "#69b3a2");
}
