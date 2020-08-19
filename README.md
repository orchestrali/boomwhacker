# Ringing Chamber

This is a chamber for (handbell) change ringing in the style known as "lapping". Ringers are responsible for a pair of *places* rather than a pair of *bells*, and the bells change physical position instead of the ringers ringing in different places.

People who enter this chamber can be assigned a pair of consecutive positions in the row (1-2, 3-4, etc.) and are in charge of whichever two virtual bells are in those positions. People on the outside pairs can only change bell positions in two ways: they can cross their bells over, or pass the inside bell to the next or previous person. People on inside pairs have four options: cross, stretch both bells out, stretch just left, and stretch just to the right. Everyone has a "places" button but it has no effect on the order of the bells.


There are two secret words that will give access to the chamber. One of the words grants "conductor" or "captain" abilities. These include:
- Changing the stage (number of bells in the room)
- Assigning pairs of places to ringers
- Starting and stopping the playing


The bell handles are color-coded the same way boomwhackers are! You can see boomwhackers being used for lapping in [this video](https://www.youtube.com/watch?v=HppkZUp1rWo).


Here are some features I'm considering adding
--------------

- ~~Option to adjust the peal time or speed~~ (implemented for captains)
- Option to adjust the handstroke gap
- Allow captains to grant captain powers
- Allow ringers to retain place assignments when the stage is changed
- ~~Display little lines above each bell as it's ringing (this may be too complicated or confusing)~~ bells now move up or down for each stroke!
- ~~Allow captains to control all pairs of places~~ (through keyboard controls)
- Option to display "handstroke" or "backstroke" as appropriate
- Option to display place notation (custom or for a named method) above the bells
- Option to turn off the audio panning
- Allow name changes after entering
- ~~Keyboard controls for moving the bells~~


To make your own copy of this ringing chamber, you can simply remix this glitch app (there should be a "remix to edit" button visible in the upper right). You'll need to add two secret words in the .env file, one called "SECRET" and one called "CAPTAIN". You'll also need to create a glitch account if you want your chamber to stick around for more than five days.

Once you've added the secret words, your copy should be fully functional—no other edits required! Click on "Show" at the top left to see your ringing chamber.

From this page, if you click on "Tools" at the bottom left, then "Import and Export", then "Import from Github", you can get any updates I've made by entering "orchestrali/boomwhacker" in the dialog that opens. This won't affect your secret words, but it will overwrite any other changes you make. You can also see my code for this app at [this repository](https://github.com/orchestrali/boomwhacker). 

