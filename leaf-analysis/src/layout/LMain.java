package layout;

import com.google.gson.Gson;

import java.io.File;
import java.io.PrintWriter;

import gson_classes.IMain;

import merge.IMainBuilder;
import merge.MMain;

import simulation.ModelSpec;
import simulation.Intention;

public class LMain {
	public final static boolean DEBUG = false;

	public static void main(String[] args) {
	    String inPath = "temp/";
	    String outPath = "temp/";
	    // TODO: Cleanup these paths and filenames.
		//String inPath = "data/mergedModels/";
		//String outPath = "data/laidoutModels/";
	    // String inPath = "src/layout/temp/";
	    // String outPath = "src/layout/temp/";
	    String inputFile = "default.json";
	    String outputFile = "default-output.json";
	
	    try {			
	        if (DEBUG) System.out.println("AutoLayout for: " + inputFile);
	
	        Gson gson = new Gson();
	        
	        // Creating the back-end model
	        ModelSpec modelSpec = MMain.convertBackboneModelFromFile(inPath + inputFile);
	        
	        // When merge models don't store intentions properly
	        for(Intention i: modelSpec.getIntentions()) {
	        	if(i.hasActor()) i.getActor().addEmbed(i);
	        }
	
	        // print model for reference
	        if (DEBUG) {
	            System.out.println("M1:");
	            IMain mIMain = IMainBuilder.buildIMain(modelSpec);
	            System.out.println(gson.toJson(mIMain));
	        }
	
	        // run auto-layout
	        LayoutAlgorithm layerOuter = new LayoutAlgorithm(modelSpec, 5001);
	        ModelSpec layedOutModel = layerOuter.layout();
	
	        // Create output file that will be used by frontend
	        IMain modelOut = IMainBuilder.buildIMain(layedOutModel);
	        if (DEBUG) System.out.println(gson.toJson(modelOut));
	
	        MMain.createOutputFile(modelOut, outPath + inputFile.replace(".json", "-output.json"));
	        if (DEBUG) System.out.println("created output file");
	
	        // Traceability
	
	
	    } catch (RuntimeException e) {
	        try {
	            if (DEBUG) System.err.println(e.getMessage());
	            File file;
	            file = new File(outPath + outputFile);
	            if (!file.exists()) {
	                file.createNewFile();
	            }
	            PrintWriter printFile = new PrintWriter(file);
	            String message = "{ \"errorMessage\" : \"RuntimeException: " + e.getMessage() + "\" }";
	            message = message.replaceAll("\\r\\n|\\r|\\n", " ");
	            printFile.printf(message);
	            printFile.close();
	        } catch (Exception f) {
	            throw new RuntimeException("Error while writing ErrorMessage: " + f.getMessage());
	        }
	    } catch (Exception e) {
	        try {
	            if (DEBUG) System.err.println(e.getMessage());
	            File file;
	            file = new File(outPath + outputFile);
	            if (!file.exists()) {
	                file.createNewFile();
	            }
	            PrintWriter printFile = new PrintWriter(file);
	            String message = "{ \"errorMessage\" : \"Exception: " + e.getMessage() + "\" }";
	            message = message.replaceAll("\\r\\n|\\r|\\n", " ");
	            printFile.printf(message);
	            printFile.close();
	        } catch (Exception f) {
	            throw new RuntimeException("Error while writing ErrorMessage: " + f.getMessage());
	        }
	    }
	}
}