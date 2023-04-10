library(knitr)

#* @serializer contentType list(type="application/pdf")
#* @get /report
#* @param num
function(res, num) {
  rmarkdown::render('report.Rmd', params = list(num = num), output_file = 'report.pdf', envir = new.env(parent = globalenv()));
  return(readBin('report.pdf', 'raw', n = file.info('report.pdf')$size));
}
