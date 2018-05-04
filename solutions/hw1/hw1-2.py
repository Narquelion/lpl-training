import random

square = [i for i in range (1, 33)]
square = [[square[i - j] for i in range(32)] for j in range(32, 0, -1)]

cond = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

square_cond = [[str(m) + '_' + str(n) for m,n in zip(square[i], cond * 4)] for i in range (0, 32)]

print ','.join(['Trial' + str(i) for i in range (1, 33)])

for l in square_cond:
	random.shuffle(l)
	print ','.join(l)