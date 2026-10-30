import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');

const projectsTitle = document.querySelector('.projects-title');
projectsTitle.textContent = `${projects.length} Projects`;

let query = '';
let selectedYear = null;
let searchInput = document.querySelector('.searchBar');

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let colors = d3.scaleOrdinal(d3.schemeTableau10);

// Projects that match the current search text
function getSearchMatches() {
  return projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
}

function renderPieChart(projectsGiven) {
  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );

  let newData = newRolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  // If the selected year has no projects under this search, drop the selection
  if (!newData.some((d) => d.label === selectedYear)) {
    selectedYear = null;
  }

  let newSliceGenerator = d3.pie().value((d) => d.value);
  let newArcData = newSliceGenerator(newData);
  let newArcs = newArcData.map((d) => arcGenerator(d));

  let svg = d3.select('#projects-pie-plot');
  svg.selectAll('path').remove();

  let legend = d3.select('.legend');
  legend.selectAll('li').remove();

  function updateSelection() {
    let selectedIndex = newData.findIndex((d) => d.label === selectedYear);

    // highlight the selected wedge and legend item
    svg
      .selectAll('path')
      .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));

    legend
      .selectAll('li')
      .attr('class', (_, idx) =>
        idx === selectedIndex ? 'legend-item selected' : 'legend-item',
      );

    // Cards use BOTH filters: the search (already in projectsGiven) and the year
    let visibleProjects =
      selectedYear === null
        ? projectsGiven
        : projectsGiven.filter((project) => project.year === selectedYear);

    renderProjects(visibleProjects, projectsContainer, 'h2');
  }

  function toggleYear(year) {
    selectedYear = selectedYear === year ? null : year;
    updateSelection();
  }

  newArcs.forEach((arc, i) => {
    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(i))
      .on('click', () => toggleYear(newData[i].label));
  });

  newData.forEach((d, idx) => {
    legend
      .append('li')
      .attr('class', 'legend-item')
      .attr('style', `--color:${colors(idx)}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => toggleYear(d.label));
  });

  updateSelection();
}

renderPieChart(getSearchMatches());

searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  renderPieChart(getSearchMatches());
});