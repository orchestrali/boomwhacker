# Ringing Chamber

This is a chamber for change ringing in the style known as "lapping". People who enter the chamber can be assigned a pair of consecutive positions in the row (1-2, 3-4, etc.) and are in charge of whichever two virtual bells are in those positions. People on the outside pairs can only change bell positions in two ways: they can cross their bells over, or pass the inside bell to the next or previous person. People on inside pairs have four options: cross, stretch both bells out, stretch just left, and stretch just to the right.


There are two secret words that will give access to the chamber. One of the words grants "conductor" or "captain" abilities. These include:
- Changing the stage (number of bells in the room)
- Assigning pairs of places to ringers
- Starting and stopping the playing


The bell handles are color-coded the same way boomwhackers are! You can see boomwhackers being used for change ringing in [this video](https://www.youtube.com/watch?v=HppkZUp1rWo).


Here are some features I'm considering adding
--------------

- Option to adjust the peal time or speed
- Option to adjust the handstroke gap
- Allow captains to grant captain powers
- Allow ringers to retain place assignments when the stage is changed
- Display little lines above each bell as it's ringing (this may be too complicated or confusing)
- Allow captains to control all pairs of places
- Option to display "handstroke" or "backstroke" as appropriate
- Option to display place notation (custom or for a named method) above the bells
- Option to turn off the audio panning
- Allow name changes after entering
- Keyboard controls for moving the bells


The code for this app is also stored at [this repository](https://github.com/orchestrali/boomwhacker). To make your own ringing chamber, you can remix this glitch app, or just create a new one and use the github import option from my boomwhacker repository. You'll also need two secret words in the .env file, one called "SECRET" and one called "CAPTAIN". Once you have your own chamber running, you can check back at that github link to see if there have been changes.


