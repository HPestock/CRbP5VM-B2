program:
				0x258, 
				I_SETV, 0, 2, 255, 1, 
				I_RLV, 
				I_ESC, 
				I_SETV, 1, 2, 0, 1, 
				I_RLV, 
				I_ESC, 
				I_BR, T_NC, T_G, 0, T_NUM, 0x258, 
				I_HALT
kernel:
				I_BR, T_NC, T_G, 0, T_REG, R_SYSRET