/**
 * Word lists for the Five-Letter Word Guess game. Plain, common dictionary words only,
 * written for Arkedia. Answers are family-friendly everyday words; guesses are the wider set
 * of words the game accepts. Every answer is also an accepted guess (see ALLOWED_GUESSES).
 */

const ANSWER_TEXT = `
about above actor acute adapt admit adopt adult after again agent agree ahead alarm album alert alien alike alive allow
alone along alter amber amuse angel anger angle angry ankle apart apple apply apron arena argue arise armor aroma arrow
aside audio avoid awake award aware
bacon badge basic basin batch beach beard beast begin being below bench berry birch black blade blame blank blast blaze
blend bless blind blink block bloom blush board boast bonus boost booth brain brave bread break brick bride brief bring
brisk broad brook broom brown brush build bunch
cabin cable camel candy canoe cargo carry catch cause cedar chain chair chalk charm chart chase cheap check cheer chess
chest chief child chill chirp choir chord chose civic claim clamp clash class clean clear clerk click cliff climb clock
close cloth cloud clown coach coast cocoa comet comic coral couch count court cover crack craft crane crash crawl crazy
cream creek crisp cross crowd crown crumb crust curve cycle
daily dairy daisy dance delay depth diary digit diner dizzy dough dozen draft drama drawn dream dress drift drill drink
drive dwarf
eager eagle early earth easel eight elbow elder empty enjoy enter equal error essay event every exact exist extra
fable faint fairy faith false fancy feast fence ferry fever field fifty fight final flame flash fleet float flock flood
floor flour fluid flute focus forge forty found frame fresh frost fruit funny
giant glass glide globe glove grace grade grain grand grape graph grass gravy great green greet grill group grove guard
guess guest guide
habit happy harsh heart heavy hedge hello hobby honey honor horse hotel house human humor hurry
ideal image index inner input issue ivory
jelly jewel joint jolly judge juice
kayak knife knock known koala
label large laser laugh layer learn lemon level light lilac limit linen llama local lodge logic loyal lucky lunar lunch
magic major maple march match mayor medal melon merit metal meter model money month motor mouse mouth movie music
nerve never night noble noise north novel nurse
ocean offer olive onion opera orbit order organ otter outer owner
paint panel paper party pasta patch peace peach pearl pedal penny piano piece pilot pinch pixel pizza place plain plane
plant plate plaza point polar porch pouch power press price pride prime print prize proof proud pulse puppy
quack queen quick quiet quilt quite quote
radar radio raise rally ranch range rapid raven reach ready relax reply rhyme ridge right river roast robin robot rocky
round route royal ruler rural
salad sauce scale scarf scene scent scoop score scout shade shape share shark sharp sheep shelf shell shift shine shirt
shore short shout sight skill skirt slice slide smile smoke snack snail snake solar solid solve sound south space spark
speak spice spoon sport spray squad stack stage stair stamp stand start steam steel stick still stone storm story stove
straw study sugar sunny super sweet swift swing sword
table taste teach thank theme thick thing think three thumb tiger title toast today token topic torch total touch tower
trace track trade trail train treat trend trial tribe trick truck trunk trust truth tulip tutor
uncle under unity until upper urban usual
valid value vapor video visit vital vivid voice
wagon waste watch water whale wheat wheel while whole world worry write
yacht yield young youth
zebra
`;

const GUESS_TEXT = `
aback abase abate abbey abbot abhor abide abled abode abort about above abuse abyss acorn acres acrid acted actor acute
adage adapt added adder adept adieu admin admit adobe adopt adore adorn adult affix afire afoot afoul after again agent
agile aging aglow agony agree ahead aided aides aimed aisle alarm album alder alert algae alias alibi alien align alike
alive alley allot allow alloy aloft alone along aloof aloud alpha altar alter amass amaze amber amble amend amiss amity
among ample amply amuse angel anger angle angry angst anime ankle annex annoy annul anvil apart apple apply apron aptly
arbor arena argue arise armor aroma arose array arrow arson artsy ascot ashen ashes aside asked askew assay asset aster
atoll atone attic audio audit augur aunts avail avert avoid await awake award aware awash awful awoke axial axiom axles
azure
bacon badge badly bagel baggy baked baker bakes bales balmy banal bands banjo barge barks barns baron based bases basic
basil basin basis baste batch bathe baths baton batty bayou beach beads beady beaks beams beans beard bears beast beats
beech beefy befit began beget begin begun beige being belch belie bells belly below belts bench bends beret berry berth
beset bight biker bikes bills binds binge bingo biome birch birds birth bison bites bitty black blade blame bland blank
blare blast blaze bleak bleat bleed blend bless blimp blind blink bliss blitz bloat block bloke blond blood bloom blown
blows bluff blunt blurb blurt blush board boast boats bogus boils bolts bonds bones bongo bonus books boost booth boots
borax bored borne bosom bossy botch bough bound bowed bowls boxer boxes brace braid brain brake brand brash brass brave
bravo brawl brawn bread break breed briar bribe brick bride brief brine bring brink briny brisk broad broil broke brood
brook broom broth brown brunt brush brute buddy budge buggy bugle build built bulbs bulge bulky bulls bully bumps bumpy
bunch bunks bunny burly burns burnt burst buses bushy butte buyer bylaw
cabal cabin cable cacao cache cadet caged cages cagey cairn calls calms camel cameo camps canal candy canes canny canoe
canon caper capes carat cards cares cargo carol carry carts carve cased cases caste casts catch cater catty caulk cause
cease cedar cello cells cents chafe chaff chain chair chalk champ chant chaos chaps charm chart chase chasm cheap cheat
check cheek cheer chess chest chick chide chief child chili chill chime chimp china chips chirp choir choke chops chord
chore chose chuck chump chunk churn chute cider cigar cinch circa civic civil clack claim clamp clams clang clank claps
clash clasp class clean clear cleat cleft clerk click cliff climb cling clink clips cloak clock clone close cloth cloud
clout clove clown clubs cluck clued clues clump clung coach coals coast coats cocoa codes coils coins colon color comes
comet comfy comic comma conch condo cones cooks cools coped copse coral cords cored cores corny corps costs couch cough
could count coupe court coven cover covet cower crabs crack craft cramp crane crank crash crass crate crave crawl craze
crazy creak cream credo creed creek creep crepe crept cress crest crews cribs cried crier cries crime crimp crisp croak
crock crone crony crook crops cross croup crowd crown crude cruel crumb crush crust crypt cubes cubic cuffs cumin cured
cures curio curly curry curse curve curvy cyber cycle cynic
daddy daily dairy daisy dally dance dandy dared dares darts dated dates datum daunt deals dealt death debit debts debug
debut decal decay decks decor decoy decry deeds deems deign deity delay delta delve demon demur denim dense depot depth
derby deter detox deuce devil dials diary dicey diets digit dimly dined diner dines dingo dingy dirty disco ditch ditto
ditty diver dives dizzy docks dodge dodgy doers doing dolls dolly domes donor donut doors dopey dorms dosed doses doubt
dough dowdy dowel downy dowry dozed dozen draft drain drake drama drank drape drawl drawn draws dread dream dress dried
drier dries drift drill drink drive droll drone drool droop drops dross drove drown drums drunk dryer dryly duchy ducks
duels dukes dully dummy dumps dumpy dunce dunes dunks dusky dusts dusty duvet dwarf dwell dwelt dying
eager eagle early earns earth eased easel eases eaten eater ebony edged edges edict edify edits eerie egret eight eject
eking elate elbow elder elect elegy elfin elide elite elope elude elves email embed ember emcee empty enact ended endow
enemy enjoy ennui ensue enter entry envoy epoch epoxy equal equip erase erect erode error erupt essay ester ether ethic
ethos evade event every evict evoke exact exalt exams excel exert exile exist exits expel extol extra exude exult
fable faced faces facet facts faded fades fails faint fairs fairy faith faked falls false famed fancy fangs farce fared
fares farms fatal fated fatty fault fauna favor fears feast feats feeds feels feign feint fella felon femur fence feral
ferry fetal fetch fever fewer fiber field fiend fiery fifth fifty fight filch filed files filet fills filly films filmy
filth final finch finds fined finer fines fired fires firms first fishy fists fixed fixer fixes fizzy fjord flags flail
flair flake flaky flame flank flaps flare flash flask flats fleas fleck fleet flesh flick flier flies fling flint flips
flirt float flock flood floor flora floss flour flout flown flows fluff fluid fluke flung flunk flush flute foals foamy
focal focus foggy foils foist folds folio folks folly fonts foods fools foray force fords forge forgo forks forms forte
forth forts forty forum found fount foxes foyer frail frame frank fraud freak freed freer fresh friar fried fries frill
frisk frock frogs frond front frost froth frown froze fruit fudge fuels fully fumes funds fungi funky funny furor furry
fused fuses fussy fuzzy
gable gaffe gaily gains gales gamer games gamma gamut gangs gases gasps gassy gates gaudy gauge gaunt gauze gavel gawky
gazed gazes gears geeky geese genie genre ghost ghoul giant giddy gifts girls girth given giver gives gizmo glade gland
glare glass glaze gleam glean glide glint gloat globe gloom glory gloss glove glows glued glues gnash gnome goals goats
godly going golem gooey goofy goose gored gorge gouge gourd gowns grabs grace grade graft grail grain grand grant grape
graph grasp grass grate grave gravy graze great greed green greet grief grill grime grimy grind grins gripe grips grits
groan groin groom grope gross group grout grove growl grown grows gruel gruff grunt guard guava guess guest guide guild
guile guilt guise gulch gulls gully gumbo gummy guppy gusto gusts gusty
habit hairy halls halts halve hands handy hangs happy hardy hares harsh haste hasty hatch hated hater hates hauls haunt
haven havoc hazel heads heady heals heaps heard hears heart heath heats heave heavy hedge heels hefty heist helix hello
helps hence herbs herds heron hides hiked hiker hikes hills hilly hinge hints hippo hired hires hitch hives hoard hobby
hoist holds holes holly homes honey honor hoods hooks hoops hoped hopes horde horns horse hosed hoses hosts hotel hound
hours house hovel hover howdy howls human humid humor humph humus hunch hunts hurry hurts husky hutch hyena hymns hyped
icily icing icons ideal ideas idiom idled idler idols idyll igloo image imbue impel imply inane inbox incur index inept
inert infer ingot inked inlay inlet inner input intro ionic irate irked irons irony islet issue itchy items ivory
jails jaunt jazzy jeans jelly jerky jests jetty jewel jiffy joins joint joist joked joker jokes jolly joule judge juice
juicy jumbo jumps jumpy juror
kappa karma kayak kebab keeps ketch khaki kicks kills kinds kings kiosk kites kitty knack knave knead kneed kneel knees
knelt knife knits knobs knock knoll knots known knows koala krill kudos
label labor laced lacks laden ladle lager lakes lambs lamps lance lands lanes lanky lapel lapse large larva laser lasso
lasts latch later lathe latte laugh layer leach leads leafy leaks leaky leans leant leaps leapt learn lease leash least
leave ledge leech leery lefty legal leggy lemon lemur lends level lever lifts light liked liken likes lilac limbo limbs
limit limps lined linen liner lines lingo links lions lists liter lithe lived liven liver lives livid llama loads loafs
loamy loans loath lobby local locks lodge lofts lofty logic login logos loins loner looks loops loopy loose lords lorry
loser loses lotto lotus louse lousy loved lover loves lower lowly loyal lucid lucky lumen lumps lumpy lunar lunch lunge
lungs lurch lured lures lurid lying lymph lyric
macaw macho macro madam madly mafia magic magma maids mails mains maize major maker makes males malls mambo mango mangy
mania manic manly manor maple march marks marry marsh masks mason match mated mates matey maths mauve maxim maybe mayor
mazes meals mealy means meant meats meaty medal media medic melee melon melts mends menus mercy merge merit merry messy
metal meter metro micro midst might miles milks milky mills mimic mince minds mined miner mines minor mints minty minus
mirth miser mists misty miter mixed mixer moans moats model modes moist molar molds moldy moles money month moods moody
moons moors moose moped moral morph mossy motel moths motif motor motto mound mount mourn mouse mousy mouth moved mover
moves movie mower mucky mucus muddy mulch mummy munch mural murky mused mushy music musky musty muted myrrh
nacho nadir nails naive named names nanny nasal nasty natal naval navel necks needs needy neigh nerds nerdy nerve nests
never newer newly nicer niche niece night nines ninja ninth noble nobly nodes noise noisy nomad noose north nosed noses
nosey notch noted notes nouns novel nudge nurse nutty nylon nymph
oaken oasis oaths occur ocean octet odder oddly odors offal offer often oiled olden older olive omega omits onion onset
opens opera opine opted optic orbit order organ other otter ought ounce outdo outer ovens overt owing owned owner oxide
ozone
paced packs paddy pagan paged pages pains paint pairs palms panel panic pansy pants paper parka parks parry parse parts
party pasta paste pasty patch paths patio patty pause paved peace peach peaks pearl pears pecan pedal peels peers penal
pence penne penny perch peril perky pesky pesto pests petal petty phase phone phony photo piano picks picky piece piety
piggy piled piles pills pilot pinch pines pinks pinky pinto pints piper pipes pique pitch pithy pivot pixel pixie pizza
place plaid plain plait plane plank plans plant plate plays plaza plead pleat plied plots pluck plugs plumb plume plump
plums plunk plush poach poems poets point poise poked poker polar poles polka polls polyp ponds pooch pools poppy porch
pored posed poser poses posse posts pouch pound pours pouty power prank prawn prays preen press preys price prick pride
pried prime print prior prism privy prize probe prone prong proof props prose proud prove prowl proxy prude prune psalm
pudgy puffy pulls pulse pumps punch pupil puppy puree purge purse pushy putty
quack quail quake qualm quark quart quash quasi queen quell query quest queue quick quiet quill quilt quirk quite quits
quota quote quoth
rabbi rabid raced racer races racks radar radii radio rafts raged rages rails rains rainy raise raked rakes rally ramen
ramps ranch range ranks rapid rarer raspy rated rates ratio ratty raved raven rayon razor reach react reads ready realm
rebar rebel rebus rebut recap recur reeds reedy reefs reels refer regal rehab reign reins relax relay relic remit renew
rents repay repel reply rerun reset resin rests retch retro retry reuse revel revue rhino rhyme rider rides ridge rifle
right rigid rigor rinds rings rinks rinse ripen riper risen riser risks risky rites rival river rivet roach roads roars
roast robes robin robot rocks rocky rodeo rogue rolls roofs rooms roomy roost roots roped ropes roses rotor rouge rough
round rouse route rover rowdy rower royal ruddy ruder rugby ruins ruled ruler rules rumba rumor rupee rural rusts rusty
sacks sadly safer sages sails saint salad sales sally salon salsa salts salty salve salvo sands sandy saner sappy sassy
satin sauce saucy sauna saute saved saves savor savvy sawed scald scale scalp scaly scamp scans scant scare scarf scary
scene scent scoff scold scone scoop scope score scorn scour scout scowl scram scrap scree screw scrub scuba seals seams
seats sedan seeds seedy seeks seems seize sells sends sense sepia serum serve setup seven sever sewed sewer shack shade
shady shaft shake shaky shale shall shame shank shape shard share shark sharp shave shawl shear sheen sheep sheer sheet
shelf shell shied shift shine shiny ships shire shirk shirt shock shoes shone shook shoot shops shore shorn short shots
shout shove shown shows showy shrub shrug shuck shunt shush shyly sided sides siege sieve sighs sight sigma signs silks
silky silly since sinew singe sings sinks siren sites sixth sixty sized sizes skate skied skier skies skiff skill skimp
skins skips skirt skulk skull skunk slabs slack slain slams slang slant slaps slash slate sleds sleek sleep sleet slept
slice slick slide slime slimy sling slink slips slope slosh sloth slots slows slump slung slunk slurp slush slyly smack
small smart smash smear smell smelt smile smirk smith smock smoke smoky snack snail snake snaps snare snarl sneak sneer
snide sniff snipe snoop snore snort snout snowy snuck snuff soapy sober socks soils solar solid solve sonar songs sonic
sooty sorry sound soups sours south sower space spade spans spare spark spasm spawn speak spear speck speed spell spelt
spend spent spice spicy spied spiel spike spiky spill spilt spine spins spiny spire spite splat split spoil spoke spoof
spook spool spoon spore sport spots spout spray spree sprig spunk spurn spurt squad squat stack staff stage staid stain
stair stake stale stalk stall stamp stand stare stark stars start stash state stave stays steak steal steam steed steel
steep steer stems steps stern stick stiff stile still stilt sting stink stint stirs stock stoic stoke stole stomp stone
stony stood stool stoop stops store stork storm story stout stove strap straw stray strip strut stuck study stuff stump
stung stunk stunt style suave sugar suing suite suits sulky sully sumac sunny super surer surge surly sushi swamp swans
swarm swath swear sweat sweep sweet swell swept swift swill swims swine swing swirl swish swoon swoop sword swore sworn
swung synod syrup
tabby table taboo tacit tacky taffy tails taint taken taker takes tales talks tally talon tamed tamer tames tango tangy
tanks taped taper tapes tapir tardy tarot tasks taste tasty tatty taunt tawny teach teams tears teary tease teddy teens
teeth tells tempo tends tenet tenor tense tenth tents tepee tepid terms terse tests testy texts thank theft their theme
there these theta thick thief thigh thing think third thorn those three threw throb throw thrum thumb thump thyme tiara
tibia ticks tidal tides tiger tight tilde tiles tills timed timer times timid tipsy tires titan tithe title toads toast
today toils token tolls tombs tonal toned tones tonic tools tooth topaz topic torch torso torus total totem touch tough
tours towed towel tower towns toxic toxin trace track tract trade trail train trait tramp trams traps trash trawl trays
tread treat trees trend tress triad trial tribe trick tried tries trill trims tripe trips trite troll troop trope trout
trove truce truck truer truly trunk truss trust truth tubby tuber tubes tucks tulip tulle tummy tumor tuned tunes tunic
turbo turns tutor twang tweak tweed tweet twice twigs twine twins twirl twist tying typed types
udder ulcer ultra uncle uncut under undid undue unfed unfit unify union unite units unity unlit unmet untie until unzip
upend upper upset urban urged urges usage users usher using usual usurp utter
vague valet valid valor value valve vapid vapor vases vault vaunt vegan veils veins venom vents venue verbs verge verse
verve vicar video views vigil vigor villa vines vinyl viola viper viral virus visas visit visor vista vital vivid vixen
vocal vogue voice voter votes vouch vowed vowel vying
wacky waded wafer waged wager wages wagon waist waits waive waken wakes walks walls waltz wands wants wards wares warms
warns wasps waste watch water watts waved waver waves waxen wears weary weave wedge weeds weedy weeks weigh weird whack
whale wharf wheat wheel whelp where which whiff while whine whiny whips whirl whisk white whole whoop whose wicks widen
wider widow width wield wilds wills wimpy wince winch winds windy wines wings winks wiped wiper wipes wired wires wiser
wispy witch witty wives woken woman women woods woody woozy words wordy works world worms wormy worry worse worst worth
would wound woven wrack wraps wrath wreak wreck wrest wring wrist write wrong wrote wrung wryly
xenon
yacht yards yarns yawns yearn years yeast yells yield yodel young yours youth yummy
zebra zesty zonal zoned zones
`;

/** Words the game picks its hidden answer from. */
export const ANSWERS: readonly string[] = ANSWER_TEXT.trim().split(/\s+/);

/** Every word the game accepts as a guess, answers included. */
export const ALLOWED_GUESSES: ReadonlySet<string> = new Set([...GUESS_TEXT.trim().split(/\s+/), ...ANSWERS]);
