<div align="center"><br><img width="847" height="135" alt="image" src="https://github.com/user-attachments/assets/90db8ca8-4ca5-4ef8-9415-5e16d798bc45" /></div><br>

## README

*한국어 버전은 [이곳](https://github.com/BROTHERHOOD42/Polarius-web/blob/main/README_kr.md)을 클릭해 주세요.
  
### Summary

A Matrix client for a proof-of-contribution economic system with contribution-weighted governance, adapted from [Element](https://github.com/element-hq/element-web). Detailed descriptions can be found in the [Polarius Overview.](https://github.com/BROTHERHOOD42/Polarius-web/docs/polarius.md)

## Getting Started

Polarius users can get started by accessing https://brotherhood42.github.io.

### The recommended development settings are as follows.

1. Dendrite Setting [(guide)](https://element-hq.github.io/dendrite/)
2. Clone Polarius-web and Polarius-desktop
3. Build Polarius-web, copy to Polarius-desktop/webapp
4. Start Polarius-desktop, go to localhost:port
  
For detailed commands, refer to the [Beginner Development Guide.](https://github.com/BROTHERHOOD42/Polarius-web/blob/main/docs/Beginner_Development_Setting_Guide.md)

## Contributing

Anyone can contribute the code to the Polarius-web and receive BROTHERHOOD currency through Polarius' proof of contribution.

### Contribution process

1. Fork Polarius-web on GitHub  
  
2. Make changes and test them in your development environment, then create a pull request.  
  
   *PR description must include:  
   Your public key in BROTHERHOOD DAO Wallet, Reasons and contents of the change, Existing Issues and Solutions, Front-and-back comparison screenshots, Test Method, Add annotations inside the code  
  
   *How to make a BROTHERHOOD DAO wallet in Polarius client:  
   After launching Polarius and logging in, search for #brotherhood42:matrix.org in the client’s search bar and join the room.  
   Once inside the DAO Space, click "Create New Wallet" on the DAO Wallet card.  
   Make sure to securely save your mnemonic phrase and public key (wallet address).

3. Review and Merge

4. Proof of Contribution in 'Polarius Development' room

   *This room is in the DCA space of the BROTHERHOOD space.  
   In this room, you can share your pull request (PR) link along with a brief request comment.  
   A verifier from the DCA room will review your PR and leave a Kubos once it's approved.  
   After that, an equivalent amount of BROTHERHOOD tokens will be automatically distributed to your DAO Wallet, based on the value of the Kubos.(It's okay to leave a comment even after the pull request has been merged.)  

   *BROTHERHOOD (B) is a new type of currency issued based on contribution. It can be freely used for exchanges and transactions between users. Additionally, when a proposal is created in the GOV Space, your BROTHERHOOD (B) balance is referenced during the snapshot process, allowing you to participate in DAO governance.  

## Workflow
   
When a release is created on polarius-web, a corresponding release is automatically generated for polarius-desktop, and it is deployed to https://brotherhood42.github.io

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


   
