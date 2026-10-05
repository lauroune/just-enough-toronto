import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'./tests/browser', fullyParallel:false, workers:1, timeout:45000,
  expect:{timeout:12000}, reporter:[['list'],['json',{outputFile:`${process.env.EVIDENCE_DIR||'evidence/v5'}/eval-results.json`}]],
  outputDir:`${process.env.EVIDENCE_DIR||'evidence/v5'}/test-artifacts`,
  use:{baseURL:process.env.EVAL_URL||'http://127.0.0.1:4183',viewport:{width:1440,height:1000},channel:'chrome',headless:true,launchOptions:{args:process.env.VERIFY_HOST_IP?[`--host-resolver-rules=MAP murch.org ${process.env.VERIFY_HOST_IP}`]:[]},reducedMotion:'reduce',trace:'retain-on-failure',screenshot:'only-on-failure'},
  webServer:process.env.EVAL_URL?undefined:{command:'npm run preview -- --port 4183 --strictPort',url:'http://127.0.0.1:4183',reuseExistingServer:true,timeout:15000},
});
