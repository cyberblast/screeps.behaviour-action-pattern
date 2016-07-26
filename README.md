# screeps.behaviour-action-pattern
Behaviour-Action Pattern for "Screeps" Game @ https://screeps.com/

###Readme V1 still under construction...

- [x] TOC
- [x] Intro
- [ ] Creep Types
- [ ] Actions
- [ ] Settings
- [ ] Status

## Contents

**1. Description**

  About this repository and the background of the general approach

**2. Creep Types**

  Description of Setup ( body, spawning ) & Behaviour of the different Creep kinds. 
  1. Worker
  2. Melee
  3. Ranger
  4. Healer
  5. Claimer
  6. Pioneer

**3. Actions**

  Description of each Action a creep can do
  1. Building
  2. Claiming
  3. Defending
  4. Feeding
  5. Fueling
  6. Guarding
  7. Harvesting
  8. Healing
  9. Idle
  10. Invading
  11. Picking
  12. Repairing
  13. Settling
  14. Storing
  15. Upgrading
  16. Withdrawing

**4. Settings & Tuning**

  1. Params

    List of global parameters
  2. How to adjust Population

    ( e.g. of workers or guards )

**5. Current State & Perspective**




##1. Description

This repository contains code for [Screeps](https://screeps.com/), a game where you have to develop code to control minions (creeps). 
I will not explain the game any further - just go there and have your own look at it. 

After playing the tutorial and doing the first steps on my own, I thought of a better approach than the simple fixed role pattern presented in the tutorial. 
Every creep is determinated and limited by its body parts, as they can't be changed anymore. This setting defines the general creep type. 
A certain creep type needs two aspects to take care of: Setup and Behaviour.

*Setup* coordinates which and how many body parts exactly and how many creeps of the type are when to be build.

*Behaviour* defines what the creep should do once it's build. 

*Action* describes a certain order or task a single creep is currently working at. 

While the behaviour of each creep type may be completely different, each single activity a creep does can be described regardless of its type or behaviour and different creep types may also do the same actions. 
In other words: *Behaviour* defines which *Action* has to be done, respecting the current situation.  

##2. Creep Types

*// TODO*

##3. Actions

*// TODO*

##4. Settings & Tuning 

*// TODO*

##5. Current State & Perspective

*// TODO*
