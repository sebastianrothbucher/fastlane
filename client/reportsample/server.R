library(plumber)

pr("reportserver.R") %>%
  pr_run(port=8000)
