import pygame
from queue import PriorityQueue
import random


pygame.init()

WIDTH = 800 #sets width to  800
screen = pygame.display.set_mode((WIDTH, WIDTH))#makes a screen of 800 by 800
pygame.display.set_caption("A* Path Finding Algorithm")#sets the title of the screen
font = pygame.font.SysFont('comicsans' ,30)

#colours
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 0, 255)
YELLOW = (255, 255, 0)
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
PURPLE = (128, 0, 128)
ORANGE = (255, 165 ,0)
GREY = (128, 128, 128)
TURQUOISE = (0,255,255)

#class
class Spot:
	def __init__(self, row, col, width, total_rows):
		self.row = row
		self.col = col
		self.x = row * width
		self.y = col * width
		self.color = WHITE
		self.neighbors = []
		self.width = width
		self.total_rows = total_rows

	def get_pos(self):#function to find position
		return self.row, self.col

	def is_closed(self):#colour shown when path is closed
		return self.color == TURQUOISE

	def is_open(self):#color shown when the path is open
		return self.color == BLUE

	def is_barrier(self):#color of the walls
		return self.color == BLACK

	def is_start(self):#color of the starting point
		return self.color == GREEN

	def is_end(self):#color of the end point
		return self.color == RED

	def reset(self):#color shown when the walls are erased
		self.color = WHITE

	def make_start(self):
		self.color = GREEN

	def make_closed(self):
		self.color = TURQUOISE

	def make_open(self):
		self.color = BLUE

	def make_barrier(self):
		self.color = BLACK

	def make_end(self):
		self.color = RED

	def make_path(self):
		self.color = YELLOW

	def draw(self, win):
		pygame.draw.rect(win, self.color, (self.x, self.y, self.width, self.width))
#shows the neighbouring blocks
	def update_neighbors(self, grid):
		self.neighbors = []
		if self.row < self.total_rows - 1 and not grid[self.row + 1][self.col].is_barrier(): # DOWN
			self.neighbors.append(grid[self.row + 1][self.col])

		if self.row > 0 and not grid[self.row - 1][self.col].is_barrier(): # UP
			self.neighbors.append(grid[self.row - 1][self.col])

		if self.col < self.total_rows - 1 and not grid[self.row][self.col + 1].is_barrier(): # RIGHT
			self.neighbors.append(grid[self.row][self.col + 1])

		if self.col > 0 and not grid[self.row][self.col - 1].is_barrier(): # LEFT
			self.neighbors.append(grid[self.row][self.col - 1])

	def __lt__(self, other):
		return False


def h(p1, p2): # makes the h value for the formula F = G + H His the estimated distance node from current node to the end node
	x1, y1 = p1
	x2, y2 = p2
	return abs(x1 - x2) + abs(y1 - y2)


def reconstruct_path(came_from, current, draw):#reconstructs path
	while current in came_from:
		current = came_from[current]
		current.make_path()
		draw()

#A* pathfinding algorithm
def algorithm(draw, grid, start, end):#A* algorithm
	count = 0
	open_set = PriorityQueue()
	open_set.put((0, count, start))
	came_from = {}
	g_score = {spot: float("inf") for row in grid for spot in row}
	g_score[start] = 0
	f_score = {spot: float("inf") for row in grid for spot in row}
	f_score[start] = h(start.get_pos(), end.get_pos())

	open_set_hash = {start}

	while not open_set.empty():
		for event in pygame.event.get():
			if event.type == pygame.QUIT:
				pygame.quit()

		current = open_set.get()[2]
		open_set_hash.remove(current)

		if current == end:
			reconstruct_path(came_from, end, draw)
			end.make_end()
			return True

		for neighbor in current.neighbors:
			temp_g_score = g_score[current] + 1

			if temp_g_score < g_score[neighbor]:
				came_from[neighbor] = current
				g_score[neighbor] = temp_g_score
				f_score[neighbor] = temp_g_score + h(neighbor.get_pos(), end.get_pos())
				if neighbor not in open_set_hash:
					count += 1
					open_set.put((f_score[neighbor], count, neighbor))
					open_set_hash.add(neighbor)
					neighbor.make_open()

		draw()

		if current != start:
			current.make_closed()

	return False

#Makes the grid
def make_grid(rows, width):
	grid = []
	gap = width // rows
	for i in range(rows):
		grid.append([])
		for j in range(rows):
			spot = Spot(i, j, gap, rows)
			grid[i].append(spot)

	return grid

#function to draw the grid
def draw_grid(win, rows, width):
	gap = width // rows
	for i in range(rows):
		pygame.draw.line(win, GREY, (0, i * gap), (width, i * gap))
		for j in range(rows):
			pygame.draw.line(win, GREY, (j * gap, 0), (j * gap, width))

#Draws the screen
def draw(win, grid, rows, width):
	win.fill(WHITE)

	for row in grid:
		for spot in row:
			spot.draw(win)

	draw_grid(win, rows, width)
	pygame.display.update()

#gets the position of the node the mouse clicks
def get_clicked_pos(pos, rows, width):
	gap = width // rows
	y, x = pos

	row = y // gap
	col = x // gap

	return row, col


def main(win, width):
	#The rows in the grid
	ROWS = 50
	#make grid
	grid = make_grid(ROWS, width)

	start = None
	end = None

	run = True
	while run:
		draw(win, grid, ROWS, width)
		for event in pygame.event.get():
			if event.type == pygame.QUIT:
				run = False
            #If mouse gets pressed make start,end then walls
			if pygame.mouse.get_pressed()[0]: # LEFT
				pos = pygame.mouse.get_pos()
				row, col = get_clicked_pos(pos, ROWS, width)
				spot = grid[row][col]
				if not start and spot != end:
					start = spot
					start.make_start()

				elif not end and spot != start:
					end = spot
					end.make_end()

				elif spot != end and spot != start:
					spot.make_barrier()
            #IF mouse gets pressed reset
			elif pygame.mouse.get_pressed()[2]: # RIGHT
				pos = pygame.mouse.get_pos()
				row, col = get_clicked_pos(pos, ROWS, width)
				spot = grid[row][col]
				spot.reset()
				if spot == start:
					start = None
				elif spot == end:
					end = None

			if event.type == pygame.KEYDOWN:
				#Key to start the algorithm
				if event.key == pygame.K_SPACE and start and end:
					for row in grid:
						for spot in row:
							spot.update_neighbors(grid)

					algorithm(lambda: draw(win, grid, ROWS, width), grid, start, end)

				if event.key == pygame.K_c:
					start = None
					end = None
					grid = make_grid(ROWS, width)

	pygame.QUIT()






#CODE FOR THE SORTING VISUALIZER STARTS HERE



#sets the background color
background_color = WHITE

side_pad = 100
top_pad = 150
#Sets the color of the list
gradients = (TURQUOISE,BLUE)

#sets font
font = pygame.font.SysFont('comicsans' ,30)

#Class for the sorting visualiser
class Drawinformation:

    def __init__(self,width,height,one):
        self.width = width
        self.height = height

        self.window = pygame.display.set_mode((width,height))
        pygame.display.set_caption("sorting algorithm")
        self.set_list(one)
#sets the structure of the list
    def set_list(self,one):
        self.one =  one
        self.min_val=min(one)
        self.max_val = max(one)
        self.block_width =(self.width - side_pad)/ len(one)
        self.block_height =((self.height - top_pad)/(self.max_val - self.min_val))
        self.start_x= side_pad//2

#Bubble sort algorithm
def bubble_sort(draw_info,ascending = True):#bubble sort which works by switching
    one = draw_info.one

    for i in range(len(one)-1):
        for j in range(len(one)-1-i):
            num1 =one[j]
            num2 = one[j+1]

            if (num1 > num2 and ascending) or (num1 < num2 and not ascending):
                one[j],one[j + 1] = one[j+1],one[j]
                draw_list(draw_info,{j:RED, j+1: BLACK},True)
                yield  True

    return one

#Insertion sort algorithm
def insertion_sort(draw_info, ascending=True): # insertion sort algorithm
    one = draw_info.one

    for i in range(1, len(one)):
        current =one[i]

        while True :
            ascending_sort = i > 0 and one[i - 1] > current and ascending
            descending_sort = i > 0 and one[i - 1] < current and not ascending

            if not ascending_sort and not descending_sort:
                break

            one[i] = one[i - 1]
            i = i -1
            one[i] = current
            draw_list(draw_info,{i - 1: RED,i:RED},True)
            yield True


    return one










#Generates the list
def generate_start_list(n,min_val,max_val):
    one = []

    for _ in range(n):
        val = random.randint(min_val,max_val)
        one.append(val)

    return one

#draws the screen
def draw2(draw_info,ascending):
	#sets the background color
   draw_info.window.fill(background_color)
   draw_list(draw_info)
   #makes the instructions one the screen
   INSTRUCTIONS = font.render("a - ascending | d - descending | r - resetlist | ",1,BLACK )
   draw_info.window.blit(INSTRUCTIONS,(draw_info.width/2 - INSTRUCTIONS.get_width()/2,45))

   algorithm_name = font.render("i - insertion sort | b = bubble sort",1,BLACK)
   draw_info.window.blit(algorithm_name,(draw_info.width/2 - algorithm_name.get_width()/2,75))


   pygame.display.update()

#function to draw list
def draw_list(draw_info,color_positions={},clear_bg=False):# it draws the list to be sorted by the algoritm
    one = draw_info.one

    if clear_bg:
        clear_rect=(side_pad//2,top_pad,draw_info.width - side_pad, draw_info.height - top_pad)
        pygame.draw.rect(draw_info.window,background_color,clear_rect)

    for i, val in enumerate(one):
        x = draw_info.start_x + i * draw_info.block_width
        y = draw_info.height - (val-draw_info.min_val)*draw_info.block_height
        color = gradients[i%2]

        if i in color_positions:
           color= color_positions[i]

        pygame.draw.rect(draw_info.window,color,(x,y,draw_info.block_width, draw_info.height))

    if clear_bg:
        pygame.display.update()






def main2():# main function
    run = True
    clock = pygame.time.Clock()
	#Number of lists
    n = 100
	#minimum valu of the list
    min_val = 0
	#maximum  of the list
    max_val = 100

    one = generate_start_list(n,min_val,max_val)
    draw_info = Drawinformation(800, 600,one)
    sorting = False
    ascending =True


    sorting_algorithm = bubble_sort
    sorting_algorithm_gen = None
    #loop to display the sorting visualiser
    while run:
        clock.tick(100)

        if sorting:
            try:
                next(sorting_algorithm_gen)
            except StopIteration:
                sorting = False
        else:
          draw2(draw_info,ascending)

        for event in pygame.event.get():
         if event ==pygame.QUIT:
             run = False

         if event.type != pygame.KEYDOWN:
             continue
         #refresh list key
         if event.key == pygame.K_r:
             one = generate_start_list(n, min_val, max_val)
             draw_info.set_list(one)

         elif event.key == pygame.K_SPACE and sorting == False:
               sorting = True
               sorting_algorithm_gen = sorting_algorithm(draw_info,ascending)
         #ascending key
         elif event.key == pygame.K_a and not sorting:
             ascending = True
             run = True
         #descending key
         elif event.key == pygame.K_d and not sorting:
             ascending = False
         #insertion sorting key
         elif event.key == pygame.K_i and not sorting:
             sorting_algorithm = insertion_sort
             pygame.display.set_caption("insertion sorting")

         #bubble sort key
         elif event.key == pygame.K_b and not sorting:
             sorting_algorithm = bubble_sort
             pygame.display.set_caption("bubble sort")



    pygame.quit()























# code for main menu starts here

#button class
class Button():
	def __init__(self, x, y, image, scale):
		width = image.get_width()
		height = image.get_height()
		self.image = pygame.transform.scale(image, (int(width * scale), int(height * scale)))
		self.rect = self.image.get_rect()
		self.rect.topleft = (x, y)
		self.clicked = False

	def draw(self, surface):
		action = False
		#get mouse position
		pos = pygame.mouse.get_pos()

		#check mouseover and clicked conditions
		if self.rect.collidepoint(pos):
			if pygame.mouse.get_pressed()[0] == 1 and self.clicked == False:
				self.clicked = True
				action = True

		if pygame.mouse.get_pressed()[0] == 0:
			self.clicked = False

		#draw button on screen
		surface.blit(self.image, (self.rect.x, self.rect.y))

		return action



#font
font2 = pygame.font.SysFont('comicsans' ,30)



#screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
screen2 = pygame.display.set_mode((800, 600))
pygame.display.set_caption('CHOOSE A ALGORITHM')

#load button images
start_img = pygame.image.load('number-one.png').convert_alpha()
start_img = pygame.transform.scale(start_img,(100,100))
exit_img = pygame.image.load('number-2.png').convert_alpha()
exit_img = pygame.transform.scale(exit_img,(100,100))
#load background
b_g = pygame.image.load('menu.jpg')
b_g =pygame.transform.scale(b_g,(800,600))

#create button instances
start_button = Button(200, 200, start_img, 0.8)
exit_button = Button(450, 200, exit_img, 0.8)

# menu function
run = True
while run:

   screen2.fill(BLACK)
   #screen2.blit(b_g,(0,0))
   main_instructions = font2.render(" CLICK 1 = PATH FINDING VISUALISER |",1,WHITE)
   screen2.blit(main_instructions,(150,30))
   main_instructions2 = font2.render(" CLICK 2 = SORTING VISUALISER |",1,WHITE)
   screen2.blit(main_instructions2,(150,70))



   if start_button.draw(screen2):
	     main(screen2,WIDTH)
   if exit_button.draw(screen2):
	    main2()

	#event handler
   for event in pygame.event.get():
	#quit game
      if event.type == pygame.QUIT:
		      run = False




   pygame.display.update()

pygame.quit()


