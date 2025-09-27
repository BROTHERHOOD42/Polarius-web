<div align="center"><br><img width="847" height="135" alt="Polarius" src="https://raw.githubusercontent.com/BROTHERHOOD42/Polarius-web/main/docs_img/Polarius.PNG" /></div><br>

## README

*한글 버전은 [이곳](https://github.com/BROTHERHOOD42/Polarius-web/blob/main/README_kr.md)을 클릭해 주세요.
  
### Summary

A Matrix client combining a Proof-of-Contribution token system for shared goals with contribution-weighted governance, adapted from Element. Detailed descriptions can be found in the [Polarius.md](https://github.com/BROTHERHOOD42/Polarius-web/blob/main/docs/Polarius.md)

## Getting Started

Polarius users can get started by accessing https://brotherhood42.github.io.

### The recommended development settings are as follows.

1. Dendrite Setting [(guide)](https://element-hq.github.io/dendrite/)
2. Clone Polarius-web and Polarius-desktop
3. Build Polarius-web, copy to Polarius-desktop/webapp
4. Start Polarius-desktop, go to localhost:port
  
For detailed commands, refer to the [Beginner Development Guide.](https://github.com/BROTHERHOOD42/Polarius-web/blob/main/docs/Beginner_Development_Setting_Guide.md)

## .github workflow
   
When a release is created on polarius-web, a corresponding release is automatically generated for polarius-desktop.

### Details
   
1. Triggering a Web Release  
   When a release is published on the polarius-web repository with a tag that starts with v, it automatically triggers a build process.  
   As part of this process, the webapp folder in the polarius-web repository is updated with the latest build.  
  
2. Desktop Release Automation  
   Once the webapp folder is updated, a signal is sent to the polarius-desktop repository.  
   This triggers a build process for all supported platforms, using the updated webapp and the generated webapp.asar:  
   + Windows (x64, ARM64)  
   + macOS  
   + Linux (amd64, ARM64)
     
   After the builds complete, a new release is automatically created in the polarius-desktop repository.

## Info

Organization: https://github.com/BROTHERHOOD42  
Homepage: https://brotherhood42.github.io  
   
