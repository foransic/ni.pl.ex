$(document).ready(function() {
  $('.activity').each(function(idx, activity) {
    dateTd = $(activity).find('td')[2];
    distTd = $(activity).find('td')[3];
    durTd = $(activity).find('td')[4];
    
    dateVal = new Date($(dateTd).html()).toLocaleString();
    distVal = Math.round($(distTd).html()*100)/100;
    durVal = $(durTd).html().replace(/\.[0]+/g, '');
    
    $(dateTd).html(dateVal);
    $(distTd).html(distVal + ' kms');
    $(durTd).html(durVal);
  });
});