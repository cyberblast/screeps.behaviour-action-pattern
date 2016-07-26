### Readme V1 still under construction...

- [x] TOC
- [x] Intro
- [ ] Creep Types
  - [x] Worker
  - [ ] Claimer  
  - [ ] Pioneer
  - [ ] Melee  
  - [ ] Ranger  
  - [ ] Healer
- [ ] Actions
- [ ] Settings
- [x] Status

## Contents

[**1. Description**](https://github.com/cyberblast/screeps.behaviour-action-pattern#1-description)

  About this repository and background of the general approach

[**2. Creep Types**](https://github.com/cyberblast/screeps.behaviour-action-pattern#2-creep-types)

  Description of Setup & Behaviour of each Creep type

  [2.1. Worker](https://github.com/cyberblast/screeps.behaviour-action-pattern#21-worker)  
  2.2. Claimer  
  2.3. Pioneer  
  2.4. Melee  
  2.5. Ranger  
  2.6. Healer

[**3. Actions**](https://github.com/cyberblast/screeps.behaviour-action-pattern#3-actions)

  Description of each Action a creep can do

  3.1. Building  
  3.2. Claiming  
  3.3. Defending  
  3.4. Feeding  
  3.5. Fueling  
  3.6. Guarding  
  3.7. Harvesting  
  3.8. Healing  
  3.9. Idle  
  3.10. Invading  
  3.11. Picking  
  3.12. Repairing  
  3.13. Settling  
  3.14. Storing  
  3.15. Upgrading  
  3.16. Withdrawing  

[**4. Settings & Tuning**](https://github.com/cyberblast/screeps.behaviour-action-pattern#4-settings--tuning)

  4.1. Params    
  List of global parameters

  4.2. How to adjust Population    
  ( e.g. of workers or guards )

[**5. Current State & Perspective**](https://github.com/cyberblast/screeps.behaviour-action-pattern#5-current-state--perspective)

#   

## 1. Description

This repository contains code for [Screeps](https://screeps.com/), a game where you have to develop code to control minions (creeps). 
I will not explain the game itself any further - just go there and have your own look at it. 

After playing the tutorial and doing the first steps on my own, I thought of a better approach than the simple fixed role pattern presented in the tutorial - this is a first trial.  
Every creep is determinated and limited by its body parts, as they can't be changed once a creep has been build. This defines the general creep type. 

Each creep type needs two aspects to take care of: *Setup* (prebuild) and *Behaviour* (postbuild).

While the behaviour of each creep type may be completely different, each single action a creep does can be described regardless of its type or behaviour and different creep types may also do the same actions (e.g. move to a flag in a different room or be idle and wait one loop - of course this doesn't work with all creep types & all actions). 
In other words: *Behaviour* defines which *Action* has to be done, respecting the current situation, and is tailored to the creeps body.  

> __*Setup*__ coordinates which and how many body parts a creep has and how many creeps (of that type) may be build.
> 
> __*Behaviour*__ defines which *Action* the creep should do in the current loop and how this decision is made. 
> 
> __*Action*__ describes a certain order or task a single creep is currently working at.   

## 2. Creep Types

The list of creep types reflects only the current state of development and is not complete. On the other hand it's also a matter of taste, valuation, experience or opinion which and how or how many different creeps are needed. So this list may never be complete (or you may want to add your own types). 

Some words about spawning and sizing of creeps:  
> The spawn will always try to build as many and as big creeps as possible. Thus each *Setup* contains limitations how big or how many creeps it is allowed to produce. 
> Those limits may get exceeded: If the current value is below a threshold it will be assumed to be valid to produce, but the new creep may finally exceed the threshold.  
>
> A regular probe of the spawn will occur every 10 loops. It will then check if it's possible to produce a new creep using this order:   
>  1. Worker  
>  2. Claimer  
>  3. Pioneer (not yet)  
>  4. Melee  
>  5. Ranger  
>  6. Healer (not yet)  

Some words about target assignment for Actions:   
> An Action can only be assigned, if there is also a valid target. Most Actions limit target assignments to a certain amount of max creeps (e.g. only one creep per construction site).

### 2.1. Worker

  The worker is the most important unit, which is able to do most of the work to establish your base and infrastructure.

  * __Setup__

    *Body:* An equal amount of CARRY, WORK & MOVE parts. Currently limited to up to 6 of each part.

    *Spawning:*
      * The total amount is limited to a total count wich is calculated considering the number of sources and their "accessible fields", which is the number of walkable fields next to a source.   
        Max count formula: `(spawn.room.sourceAccessibleFields * 1.2) + (spawn.room.sources.length * 2)` 
      * The total weight (energy cost of all workers in the room) is also limited considering the amount of sources.  
        Max weight formula: `spawn.room.sources.length * 3000`
      * Will not spawn if available energy (Spawn + Extensions) is below 50%

  * __Behaviour__

    The creep will always check if it has a memorized action and if its target is still valid. Otherwise it will demand a new order.
    To assigning a new action, a certain order of possible actions will be probed and the first valid action will be assigned.
     
    Action priorization depends on 2 questions:
    * Does the creep carry any energy?
    * Are there any enemy creeps in the same room  

    __Action priority__
      * _Carrying no energy & no enemy creeps present_
        * Picking
        * Harvesting
        * Withdrawing
        * Idle
      * _Carrying no energy & enemy creeps present_
        * Withdrawing
        * Harvesting
        * Idle
      * _Carrying some energy & no creeps present_
        * Picking
        * Feeding
        * Repairing (urgents)
        * Building
        * Storing
        * Upgrading
        * Idle
      * _Carrying some energy & enemy creeps present_
        * Feeding
        * Fueling
        * Repairing (urgents)
        * Building
        * Storing
        * Upgrading
        * Idle

    > To differenciate beyond the flat list of priorities, each Action has its own limitations when it is valid.  
    > e.g. storing is only valid when there is at least one creep already upgrading etc.
 
### 2.2. Claimer
*// TODO*  
### 2.3. Pioneer
*// TODO*
### 2.4. Melee
*// TODO*  
### 2.5. Ranger
*// TODO*  
### 2.6. Healer
*// TODO*  

## 3. Actions

*// TODO*

## 4. Settings & Tuning 

*// TODO*

## 5. Current State & Perspective

The whole project is completely unfinished and may also be unstable (while on the other hand my rooms are running on it). 
Feel free to get your own fork or use parts of the code, but always at your own risk.

This is a game. A hobby. I am doing this for fun. I don't feel responsible for anything this code does with your game neither do I feel any responsibility to advance further with the development - if I go on with the development it will be just for fun! (while on the other hand I don't think about quitting the development!) 

There are large gaps which still need to be filled.  
A lot of structure types are not yet utilized and still some actions and creep types are missing. 
Full automatism (e.g. build roads & structures) would be nice, but is also far from reached.  

Another big point missing is a macro strategy. Most current advancement is focusing on micro management (within a single room) or handling of certain tasks (like manually set flags). Decisions and tasks relating to the whole colony and player interaction will become more and more important. 

I don't know how much time I can spend and how fast this will develop and will appreciate any help and contribution to this project. 

Have a good time! 

[cyberblast](https://github.com/cyberblast/screeps.behaviour-action-pattern)  
2016 July